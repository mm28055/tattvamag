"use client";
// TipTap-backed rich-text editor for notebook entries. A stripped-down sibling
// of RichEditor — short fragments don't need footnotes, indent, or colour, so
// the toolbar is deliberately minimal: bold, italic, H2/H3, quote, lists,
// link, image (with alt + caption), undo/redo.
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import { useEffect, useRef, useState } from "react";

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

export default function NotebookRichEditor({ value, onChange, onUploadImage }: Props) {
  const initialRef = useRef(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      CaptionedImage.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: "tm-editor-img" } }),
      LinkExt.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Re-sync when the parent swaps in a new value (e.g. async load on the edit
  // page). Guarded so typing isn't clobbered on every keystroke.
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
          min-height: 280px;
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 16px;
          line-height: 1.72;
          color: #2a2520;
          outline: none;
        }
        .tm-rich-editor .ProseMirror p { margin: 0 0 14px; }
        .tm-rich-editor .ProseMirror h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-style: italic;
          font-weight: 500;
          color: #1a1714;
          margin: 24px 0 10px;
        }
        .tm-rich-editor .ProseMirror h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 500;
          color: #1a1714;
          margin: 20px 0 8px;
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
        .tm-rich-editor .ProseMirror a { color: #B83A14; text-decoration: underline; }
        .tm-rich-editor .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  );
}

function Toolbar({ editor, onUploadImage }: { editor: Editor; onUploadImage?: (file: File) => Promise<string | null> }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, forceRender] = useState({});
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

  const imageSelected = editor.isActive("image");

  return (
    <div style={toolbarStyle}>
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
        <strong>B</strong>
      </Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
        <em>I</em>
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
      {imageSelected && (
        <Btn onClick={editCaption} title="Edit image caption">
          Caption…
        </Btn>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: "none" }} />
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
