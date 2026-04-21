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
    const num = (HTMLAttributes["data-ref"] as string) || "";
    const note = (HTMLAttributes["data-note"] as string) || "";
    // `title` gives editors a hover preview of the note text. The server
    // strips data-note (and re-renders) before saving, so this never ships
    // to readers.
    const attrs: Record<string, string> = { class: "footnote-ref" };
    if (note) attrs.title = note;
    return ["sup", mergeAttributes(HTMLAttributes, attrs), num];
  },
});

const COLOR_SWATCHES = [
  { name: "default", value: null },
  { name: "red", value: "#B83A14" },
  { name: "green", value: "#4a5e3a" },
  { name: "blue", value: "#2c4a6b" },
  { name: "muted", value: "#6b6259" },
];

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
      ImageExt.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: "tm-editor-img" } }),
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
        .tm-rich-editor .ProseMirror blockquote {
          border-left: 3px solid #B83A14;
          margin: 18px 0;
          padding: 2px 0 2px 16px;
          color: #3a332c;
          font-style: italic;
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
        .tm-rich-editor .ProseMirror sup.footnote-ref {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #B83A14;
          padding: 0 3px;
          cursor: pointer;
          background: #f0e6d6;
          border-radius: 2px;
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

function Toolbar({ editor, onUploadImage }: { editor: Editor; onUploadImage?: (file: File) => Promise<string | null> }) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
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

  const insertImage = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUploadImage) return;
    const src = await onUploadImage(file);
    if (!src) return;
    const alt = window.prompt("Alt text for this image (optional)", "") || "";
    editor.chain().focus().setImage({ src, alt }).run();
  };

  const setColor = (color: string | null) => {
    if (color === null) editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
    setColorPickerOpen(false);
  };

  const insertFootnote = () => {
    const note = window.prompt("Footnote text", "");
    if (note === null || !note.trim()) return;
    // Pick the next ref number by scanning what's currently in the doc. We
    // let the server renumber sequentially on save, so this is just a
    // stable temporary id.
    const html = editor.getHTML();
    const existing = [...html.matchAll(/data-ref="([^"]+)"/g)].map((m) => parseInt(m[1], 10)).filter((n) => !Number.isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "footnoteRef",
        attrs: { dataRef: String(next), dataNote: note.trim() },
      })
      .run();
  };

  const editFootnote = () => {
    const attrs = editor.getAttributes("footnoteRef");
    const currentNote = (attrs.dataNote as string) || "";
    const note = window.prompt("Edit footnote text (clear to delete)", currentNote);
    if (note === null) return;
    if (note.trim() === "") {
      editor.chain().focus().deleteSelection().run();
      return;
    }
    editor.chain().focus().updateAttributes("footnoteRef", { dataNote: note.trim() }).run();
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
      <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
        &ldquo; &rdquo;
      </Btn>
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
      <div style={{ position: "relative" }}>
        <Btn onClick={() => setColorPickerOpen((v) => !v)} title="Text colour" active={colorPickerOpen}>
          A
          <span style={{ display: "inline-block", width: "14px", height: "3px", background: (editor.getAttributes("textStyle").color as string) || "#1a1714", marginLeft: "4px", verticalAlign: "middle" }} />
        </Btn>
        {colorPickerOpen && (
          <div style={swatchPanelStyle}>
            {COLOR_SWATCHES.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setColor(s.value)}
                title={s.name}
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: s.value || "transparent",
                  border: s.value ? "1px solid #0002" : "1px dashed #8b7f72",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}
      </div>
      <Sep />
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">↶</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">↷</Btn>
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
  overflow: "hidden",
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  flexWrap: "wrap",
  padding: "8px 10px",
  borderBottom: "1px solid #e2ddd5",
  background: "#faf5e8",
};

const swatchPanelStyle: React.CSSProperties = {
  position: "absolute",
  top: "34px",
  left: 0,
  zIndex: 10,
  display: "flex",
  gap: "6px",
  padding: "8px",
  background: "#fff",
  border: "1px solid #d4cdc2",
  borderRadius: "2px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};
