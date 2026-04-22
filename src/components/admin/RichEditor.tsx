"use client";
// TipTap-backed rich-text editor for the admin article composer. Produces
// HTML compatible with the reader's htmlToInline pipeline:
// - Uses <strong>/<em> for bold/italic (both preserved into block text)
// - Uses <span style="color: ..."> for inline text color (preserved as a
//   passthrough token in renderInline)
// - Preserves <sup class="footnote-ref" data-ref="N"> round-trip via a
//   custom read-only node, so existing footnotes survive editing
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Node, Extension, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { useEffect, useRef, useState } from "react";

// Paragraph/heading indent stored as a data-indent attribute (and matching
// padding-left for live preview). The reader pipeline reads data-indent off
// the <p> and applies the same padding on the reader page.
const INDENT_PX_PER_LEVEL = 32;
const MAX_INDENT_LEVEL = 6;
const IndentExtension = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el: HTMLElement) => parseInt(el.getAttribute("data-indent") || "0", 10) || 0,
            renderHTML: (attrs: Record<string, unknown>) => {
              const n = (attrs.indent as number) || 0;
              if (!n) return {};
              return { "data-indent": String(n), style: `padding-left: ${n * INDENT_PX_PER_LEVEL}px;` };
            },
          },
        },
      },
    ];
  },
  addKeyboardShortcuts() {
    const adjust = (delta: number) => () => {
      const ed = this.editor;
      // Lists already use Tab to sink/lift items — don't steal that.
      if (ed.isActive("listItem")) return false;
      const nodeName = ed.isActive("heading") ? "heading" : "paragraph";
      const cur = (ed.getAttributes(nodeName).indent as number) || 0;
      const next = Math.max(0, Math.min(MAX_INDENT_LEVEL, cur + delta));
      if (next === cur) return false;
      return ed.chain().focus().updateAttributes(nodeName, { indent: next }).run();
    };
    return { Tab: adjust(1), "Shift-Tab": adjust(-1) };
  },
});

// Custom node that renders a footnote-ref <sup> as an inline atom.
// Stores both data-ref (number) and data-note (the note body) so editors can
// see and edit the note inline. The server strips data-note before saving
// the body and rebuilds the footnotes JSONB from the collected notes.
const FootnoteRef = Node.create({
  name: "footnoteRef",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      dataRef: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-ref"),
        renderHTML: (attrs: Record<string, unknown>) => (attrs.dataRef ? { "data-ref": String(attrs.dataRef) } : {}),
      },
      dataNote: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-note") || "",
        renderHTML: (attrs: Record<string, unknown>) => (attrs.dataNote ? { "data-note": String(attrs.dataNote) } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "sup.footnote-ref" }];
  },
  renderHTML({ HTMLAttributes }) {
    const note = (HTMLAttributes["data-note"] as string) || "";
    // `title` gives editors a hover preview of the note text. The server
    // strips data-note (and re-renders) before saving, so this never ships
    // to readers.
    const attrs: Record<string, string> = { class: "footnote-ref" };
    if (note) attrs.title = note;
    // Render an empty sup — the displayed number is injected by a CSS
    // counter (see .footnote-ref::before in the editor stylesheet) so it
    // always matches position, not the stale stored data-ref. The
    // data-ref attribute is preserved on the element for server-side
    // mapping back to the note body on save.
    return ["sup", mergeAttributes(HTMLAttributes, attrs)];
  },
});

const CaptionedImage = ImageExt.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (node: string | HTMLElement) => {
          if (typeof node === "string") return false;
          const img = node.querySelector("img");
          if (!img) return false;
          const figcaption = node.querySelector("figcaption");
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title"),
            caption: figcaption?.textContent?.trim() || null,
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (node: string | HTMLElement) => {
          if (typeof node === "string") return false;
          return {
            src: node.getAttribute("src"),
            alt: node.getAttribute("alt"),
            title: node.getAttribute("title"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...imgAttrs } = HTMLAttributes;
    if (caption) {
      return [
        "figure",
        { class: "tm-editor-figure" },
        ["img", imgAttrs],
        ["figcaption", {}, caption],
      ];
    }
    return ["img", imgAttrs];
  },

  addNodeView() {
    return ({ node }: { node: { type: { name: string }; attrs: Record<string, unknown> } }) => {
      const figure = document.createElement("figure");
      figure.className = "tm-editor-figure";

      const img = document.createElement("img");
      img.src = (node.attrs.src as string) || "";
      img.alt = (node.attrs.alt as string) || "";
      img.className = "tm-editor-img";
      figure.appendChild(img);

      const cap = document.createElement("figcaption");
      cap.className = "tm-editor-figcaption";
      if (node.attrs.caption) {
        cap.textContent = node.attrs.caption as string;
        figure.appendChild(cap);
      }

      return {
        dom: figure,
        update(updatedNode: { type: { name: string }; attrs: Record<string, unknown> }) {
          if (updatedNode.type.name !== "image") return false;
          img.src = (updatedNode.attrs.src as string) || "";
          img.alt = (updatedNode.attrs.alt as string) || "";
          if (updatedNode.attrs.caption) {
            cap.textContent = updatedNode.attrs.caption as string;
            if (!cap.parentNode) figure.appendChild(cap);
          } else if (cap.parentNode) {
            cap.remove();
          }
          return true;
        },
        selectNode() {
          figure.classList.add("ProseMirror-selectednode");
        },
        deselectNode() {
          figure.classList.remove("ProseMirror-selectednode");
        },
      };
    };
  },
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
};

export default function RichEditor({ value, onChange, onUploadImage }: Props) {
  const initialRef = useRef(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit already includes paragraph, heading, bold, italic,
        // strike, blockquote, bulletList, orderedList, horizontalRule,
        // history, hardBreak, code, codeBlock.
        heading: { levels: [2, 3] },
      }),
      CaptionedImage.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: "tm-editor-img" } }),
      LinkExt.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } }),
      TextStyle,
      Color,
      FootnoteRef,
      IndentExtension,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Re-sync the editor when the parent swaps in a new value (e.g. after
  // an async load). Guard with a ref so we don't clobber the user's in-flight
  // edits on every keystroke.
  useEffect(() => {
    if (!editor) return;
    if (value === initialRef.current) return;
    initialRef.current = value;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div style={editorShellStyle}>
        <div style={{ padding: "16px", color: "#8b7f72", fontStyle: "italic", fontFamily: "'Source Serif 4', Georgia, serif" }}>
          Loading editor…
        </div>
      </div>
    );
  }

  return (
    <div style={editorShellStyle}>
      <Toolbar editor={editor} onUploadImage={onUploadImage} />
      <EditorContent editor={editor} className="tm-rich-editor" />
      <style>{`
        .tm-rich-editor .ProseMirror {
          padding: 20px 22px;
          min-height: 360px;
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 16px;
          line-height: 1.72;
          color: #2a2520;
          outline: none;
        }
        .tm-rich-editor .ProseMirror p { margin: 0 0 14px; }
        .tm-rich-editor .ProseMirror h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-style: italic;
          font-weight: 500;
          color: #1a1714;
          margin: 28px 0 12px;
        }
        .tm-rich-editor .ProseMirror h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 21px;
          font-weight: 500;
          color: #1a1714;
          margin: 22px 0 10px;
        }
        /* Blockquote renders as a pullquote on the reader — mirror that here
         * so the editor is WYSIWYG: centred text, larger italic serif,
         * cinnabar rules top and bottom. */
        .tm-rich-editor .ProseMirror blockquote {
          margin: 36px 0;
          padding: 28px 0;
          border-top: 1px solid #B83A14;
          border-bottom: 1px solid #B83A14;
          text-align: center;
          color: #2a2520;
        }
        .tm-rich-editor .ProseMirror blockquote p {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 24px;
          line-height: 1.4;
          font-weight: 400;
          margin: 0;
        }
        .tm-rich-editor .ProseMirror ul, .tm-rich-editor .ProseMirror ol { padding-left: 26px; margin: 0 0 14px; }
        .tm-rich-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px 0;
          border: 1px solid #e2ddd5;
          cursor: pointer;
        }
        .tm-rich-editor .ProseMirror img.ProseMirror-selectednode { outline: 2px solid #B83A14; }
        .tm-rich-editor .ProseMirror figure.tm-editor-figure {
          margin: 16px 0;
          text-align: center;
        }
        .tm-rich-editor .ProseMirror figure.tm-editor-figure img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
          border: 1px solid #e2ddd5;
          cursor: pointer;
        }
        .tm-rich-editor .ProseMirror figure.tm-editor-figure.ProseMirror-selectednode {
          outline: 2px solid #B83A14;
          outline-offset: 2px;
          border-radius: 2px;
        }
        .tm-rich-editor .ProseMirror figure.tm-editor-figure figcaption {
          margin-top: 8px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 14px;
          color: #6b6259;
          line-height: 1.5;
        }
        /* Live sequential footnote numbering — the editor shows [1], [2],
           [3]… based on position, not on the stored data-ref. This keeps
           the editor in sync with the reader view even between edits and
           the next save/reload. */
        .tm-rich-editor .ProseMirror {
          counter-reset: footnote-ref;
        }
        .tm-rich-editor .ProseMirror sup.footnote-ref {
          counter-increment: footnote-ref;
          padding: 0 3px;
          cursor: pointer;
          background: #f0e6d6;
          border-radius: 2px;
        }
        .tm-rich-editor .ProseMirror sup.footnote-ref::before {
          content: counter(footnote-ref);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #B83A14;
        }
        .tm-rich-editor .ProseMirror sup.footnote-ref:hover {
          background: #e6d7b8;
        }
        .tm-rich-editor .ProseMirror sup.footnote-ref.ProseMirror-selectednode {
          outline: 2px solid #B83A14;
          outline-offset: 1px;
        }
        .tm-rich-editor .ProseMirror a { color: #B83A14; text-decoration: underline; }
        .tm-rich-editor .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  );
}

// Encode a note string (asterisk-italic markers) into HTML suitable for a
// contenteditable field — escape HTML-special chars, then turn *word* into
// <em>word</em>.
function noteToContentEditableHtml(note: string): string {
  return note
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
}

// Round-trip: take contenteditable HTML from the footnote popover and reduce
// it to a plain string with *word* italic markers. Only <em>/<i> survive as
// asterisks — everything else is stripped. This matches the reader's
// renderInline() which already turns *word* into <em>word</em>.
function contentEditableHtmlToNote(html: string): string {
  return html
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, inner) =>
      `*${inner.replace(/<[^>]+>/g, "")}*`,
    )
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>\s*<p[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function FootnotePopover({
  initialNote,
  mode,
  onSave,
  onCancel,
  onDelete,
}: {
  initialNote: string;
  mode: "insert" | "edit";
  onSave: (note: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const editableRef = useRef<HTMLDivElement>(null);
  const [italicActive, setItalicActive] = useState(false);

  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    el.innerHTML = noteToContentEditableHtml(initialNote || "");
    // Move caret to the end
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.focus();
  }, [initialNote]);

  // Track whether the current selection is inside an <em> so the Italic
  // button can show an active state.
  useEffect(() => {
    const update = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      if (!node) return;
      // `Node` is shadowed by the TipTap Node import at the top of the
      // file, so use the global DOM interface explicitly here.
      let el: globalThis.Node | null = node;
      while (el && el !== editableRef.current) {
        if (el.nodeType === 1) {
          const tag = (el as HTMLElement).tagName.toLowerCase();
          if (tag === "em" || tag === "i") {
            setItalicActive(true);
            return;
          }
        }
        el = (el as globalThis.Node).parentNode;
      }
      setItalicActive(false);
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  const toggleItalic = () => {
    editableRef.current?.focus();
    document.execCommand("italic");
  };

  const commit = () => {
    const html = editableRef.current?.innerHTML || "";
    const note = contentEditableHtmlToNote(html);
    if (!note) {
      // Empty note → cancel on insert, delete on edit.
      if (mode === "edit" && onDelete) onDelete();
      else onCancel();
      return;
    }
    onSave(note);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      toggleItalic();
    }
  };

  return (
    <div style={footnotePopoverOverlayStyle} onClick={onCancel}>
      <div style={footnotePopoverStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5a5048", fontWeight: 600, marginBottom: "8px" }}>
          {mode === "insert" ? "New footnote" : "Edit footnote"}
        </div>
        <div style={{ display: "flex", gap: "2px", marginBottom: "8px", alignItems: "center" }}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleItalic}
            title="Italic (Ctrl+I)"
            style={{
              minWidth: "30px",
              height: "28px",
              padding: "0 10px",
              background: italicActive ? "#1a1714" : "transparent",
              color: italicActive ? "#FAF5E8" : "#3a3530",
              border: "1px solid #d4cdc2",
              borderRadius: "3px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <em>I</em>
          </button>
          <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "12px", color: "#8b7f72", fontStyle: "italic", marginLeft: "8px" }}>
            Select words and click I to italicize
          </span>
        </div>
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={onKeyDown}
          style={{
            minHeight: "90px",
            maxHeight: "260px",
            overflow: "auto",
            padding: "12px 14px",
            border: "1px solid #d4cdc2",
            borderRadius: "3px",
            background: "#fff",
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "15px",
            lineHeight: 1.6,
            color: "#1a1714",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "12px", alignItems: "center" }}>
          {mode === "edit" && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: "#B83A14",
                border: "1px solid #B83A14",
                borderRadius: "2px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
                cursor: "pointer",
                marginRight: "auto",
              }}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 14px",
              background: "transparent",
              color: "#6b6259",
              border: "1px solid #d4cdc2",
              borderRadius: "2px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commit}
            style={{
              padding: "8px 14px",
              background: "#1a1714",
              color: "#FAF5E8",
              border: "none",
              borderRadius: "2px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Toolbar({ editor, onUploadImage }: { editor: Editor; onUploadImage?: (file: File) => Promise<string | null> }) {
  const [footnotePopover, setFootnotePopover] = useState<
    | { mode: "insert"; initial: "" }
    | { mode: "edit"; initial: string }
    | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, forceRender] = useState({});
  // Re-render toolbar state (active marks, etc.) when selection changes.
  useEffect(() => {
    const update = () => forceRender({});
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const editImage = () => {
    const attrs = editor.getAttributes("image");
    const currentAlt = (attrs.alt as string) || "";
    const currentSrc = (attrs.src as string) || "";
    if (!currentSrc) return;
    const alt = window.prompt("Image alt / description", currentAlt);
    if (alt === null) return;
    editor.chain().focus().updateAttributes("image", { alt }).run();
  };

  const editCaption = () => {
    const attrs = editor.getAttributes("image");
    const currentCaption = (attrs.caption as string) || "";
    const caption = window.prompt("Image caption (shown below the image)", currentCaption);
    if (caption === null) return;
    editor.chain().focus().updateAttributes("image", { caption: caption.trim() || null }).run();
  };

  const insertImage = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUploadImage) return;
    const src = await onUploadImage(file);
    if (!src) return;
    const alt = window.prompt("Alt text for this image (optional)", "") || "";
    const caption = window.prompt("Caption for this image (optional, shown below the image)", "") || "";
    editor.chain().focus().insertContent({ type: "image", attrs: { src, alt, caption: caption || null } }).run();
  };

  const insertFootnote = () => {
    setFootnotePopover({ mode: "insert", initial: "" });
  };

  const editFootnote = () => {
    const attrs = editor.getAttributes("footnoteRef");
    const currentNote = (attrs.dataNote as string) || "";
    setFootnotePopover({ mode: "edit", initial: currentNote });
  };

  const commitInsertFootnote = (note: string) => {
    // Pick the next ref number by scanning what's currently in the doc. We
    // let the server renumber sequentially on save, so this is just a
    // stable temporary id.
    const html = editor.getHTML();
    const existing = [...html.matchAll(/data-ref="([^"]+)"/g)]
      .map((m) => parseInt(m[1], 10))
      .filter((n) => !Number.isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "footnoteRef",
        attrs: { dataRef: String(next), dataNote: note },
      })
      .run();
    setFootnotePopover(null);
  };

  const commitEditFootnote = (note: string) => {
    editor.chain().focus().updateAttributes("footnoteRef", { dataNote: note }).run();
    setFootnotePopover(null);
  };

  const deleteFootnote = () => {
    editor.chain().focus().deleteSelection().run();
    setFootnotePopover(null);
  };

  const imageSelected = editor.isActive("image");
  const footnoteSelected = editor.isActive("footnoteRef");

  return (
    <div style={toolbarStyle}>
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
        <strong>B</strong>
      </Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
        <em>I</em>
      </Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <span style={{ textDecoration: "line-through" }}>S</span>
      </Btn>
      <Sep />
      <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        H2
      </Btn>
      <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        H3
      </Btn>
      <Sep />
      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        •
      </Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
        1.
      </Btn>
      <Sep />
      <Btn active={editor.isActive("link")} onClick={addLink} title="Link">
        🔗
      </Btn>
      <Btn onClick={insertImage} title="Insert image">
        🖼
      </Btn>
      {imageSelected && (
        <Btn onClick={editImage} title="Edit image alt text">
          Alt…
        </Btn>
      )}
      {imageSelected && (
        <Btn onClick={editCaption} title="Edit image caption">
          Caption…
        </Btn>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: "none" }} />
      <Sep />
      <Btn onClick={() => { if (!editor.isActive("listItem")) { const n = (editor.isActive("heading") ? "heading" : "paragraph"); const cur = (editor.getAttributes(n).indent as number) || 0; editor.chain().focus().updateAttributes(n, { indent: Math.min(MAX_INDENT_LEVEL, cur + 1) }).run(); } }} title="Indent (Tab)">→|</Btn>
      <Btn onClick={() => { if (!editor.isActive("listItem")) { const n = (editor.isActive("heading") ? "heading" : "paragraph"); const cur = (editor.getAttributes(n).indent as number) || 0; if (cur > 0) editor.chain().focus().updateAttributes(n, { indent: cur - 1 }).run(); } }} title="Outdent (Shift+Tab)">|←</Btn>
      <Sep />
      <Btn onClick={insertFootnote} title="Insert footnote at cursor">Fn+</Btn>
      {footnoteSelected && (
        <Btn onClick={editFootnote} title="Edit or delete the selected footnote">Edit footnote…</Btn>
      )}
      <Sep />
      <Btn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Pullquote — centre text between cinnabar rules"
      >
        <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "2px", lineHeight: 1 }}>
          <span style={{ width: "14px", height: "2px", background: "#B83A14" }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", fontWeight: 500 }}>PQ</span>
          <span style={{ width: "14px", height: "2px", background: "#B83A14" }} />
        </span>
      </Btn>
      <Sep />
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">↶</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">↷</Btn>
      {footnotePopover && (
        <FootnotePopover
          mode={footnotePopover.mode}
          initialNote={footnotePopover.initial}
          onSave={(note) => {
            if (footnotePopover.mode === "insert") commitInsertFootnote(note);
            else commitEditFootnote(note);
          }}
          onCancel={() => setFootnotePopover(null)}
          onDelete={footnotePopover.mode === "edit" ? deleteFootnote : undefined}
        />
      )}
    </div>
  );
}

function Btn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      style={{
        minWidth: "30px",
        height: "30px",
        padding: "0 8px",
        background: active ? "#1a1714" : "transparent",
        color: active ? "#FAF5E8" : "#3a3530",
        border: "1px solid transparent",
        borderRadius: "3px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "13px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: "1px", height: "22px", background: "#d4cdc2", margin: "0 4px" }} />;
}

const editorShellStyle: React.CSSProperties = {
  border: "1px solid #d4cdc2",
  borderRadius: "2px",
  background: "#fff",
  // Note: `overflow: hidden` would break `position: sticky` on the toolbar
  // below — any overflow-clipping ancestor confines a sticky child. Leave
  // overflow at its default (visible) so the toolbar can latch to the
  // viewport top while the reader scrolls through long body content.
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  flexWrap: "wrap",
  padding: "8px 10px",
  borderBottom: "1px solid #e2ddd5",
  background: "#faf5e8",
  // Pin the toolbar to the top of the viewport while the user scrolls
  // through a long body. It unsticks automatically once the editor shell
  // scrolls past, so it only hovers while you're inside the body field.
  // z-index must exceed the SiteHeader's fixed compact bar (z-index 90)
  // so the toolbar isn't hidden behind it on admin pages.
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 4px 8px -6px rgba(0,0,0,0.15)",
};


const footnotePopoverOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(26, 23, 20, 0.35)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const footnotePopoverStyle: React.CSSProperties = {
  width: "min(560px, 100%)",
  background: "#faf5e8",
  border: "1px solid #d4cdc2",
  borderRadius: "4px",
  padding: "18px 20px 16px",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
};
