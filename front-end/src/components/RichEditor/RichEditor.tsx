import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";

import "./richEditor.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

const normalizeHtml = (input: string | null | undefined): string => {
  return (input || "").trim();
};

export default function RichEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollHostRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      Highlight,
      TextStyle,
      Color,
      FontFamily,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    editorProps: {
      attributes: {
        class: "rich-editor-prose",
      },
    },
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextValue = normalizeHtml(value);
    const currentValue = normalizeHtml(editor.getHTML());

    if (currentValue !== nextValue) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    const host = scrollHostRef.current;
    if (!host) return;

    const handleWheel = (event: WheelEvent) => {
      const prose = host.querySelector(".rich-editor-prose") as HTMLElement | null;
      if (!prose || event.deltaY === 0) return;

      const maxScrollTop = prose.scrollHeight - prose.clientHeight;
      if (maxScrollTop <= 0) return;

      const previous = prose.scrollTop;
      const next = Math.max(0, Math.min(maxScrollTop, previous + event.deltaY));

      if (next !== previous) {
        prose.scrollTop = next;
        event.preventDefault();
      }
    };

    host.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      host.removeEventListener("wheel", handleWheel);
    };
  }, []);

  async function handleImageUpload(file: File) {
    if (!editor) return;

    try {
      setUploading(true);

      const presignRes = await api.post("/admin/editor/upload-image", {
        filename: file.name,
        contentType: file.type || "image/jpeg",
      });

      const { uploadUrl, fileUrl } = presignRes.data;

      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      await api.post("/admin/editor/images", {
        imageUrl: fileUrl,
        filename: file.name,
        contentType: file.type,
      });

      editor.chain().focus().setImage({ src: fileUrl }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    handleImageUpload(file);
    e.target.value = "";
  }

  if (!editor) return null;

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
    ? "2"
    : editor.isActive("heading", { level: 3 })
    ? "3"
    : "0";

  const fontValue =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) || "";

  return (
    <div className="rich-editor">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="rich-toolbar">
        <select
          className="toolbar-select"
          value={headingValue}
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
              return;
            }
            editor
              .chain()
              .focus()
              .toggleHeading({ level: level as 1 | 2 | 3 })
              .run();
          }}
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <select
          className="toolbar-select"
          value={fontValue}
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
        >
          <option value="">Default</option>
          <option value="Inter">Inter</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="monospace">Monospace</option>
        </select>

        <input
          type="color"
          aria-label="Text color"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
        />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive("highlight") ? "is-active" : ""}
          title="Highlight"
        >
          HL
        </button>

        <button
          type="button"
          onClick={openFilePicker}
          disabled={uploading}
          title="Insert Image"
          className="image-button"
        >
          {uploading ? "..." : "IMG"}
        </button>
      </div>

      <div className="rich-editor-scroll" ref={scrollHostRef}>
        <EditorContent editor={editor} className="rich-editor-host" />
      </div>
    </div>
  );
}
