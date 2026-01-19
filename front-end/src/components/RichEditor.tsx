import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

import "./richEditor.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function RichEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Keep editor in sync when switching items
  useEffect(() => {
    if (!editor) return;

    if (editor.getHTML() !== (value || "")) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  /**
   * Upload image to S3 and insert into editor
   */
  async function handleImageUpload(file: File) {
    if (!editor) return;

    try {
      setUploading(true);

      // 1️⃣ Get presigned URL from backend
      const presignRes = await api.post("/admin/editor/upload-image", {
        filename: file.name,
        contentType: file.type || "image/jpeg",
      });

      const { uploadUrl, fileUrl } = presignRes.data;

      // 2️⃣ Upload to S3
      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      // 3️⃣ Save metadata to MongoDB
      await api.post("/admin/editor/images", {
        imageUrl: fileUrl,
        filename: file.name,
        contentType: file.type,
      });

      // 4️⃣ Insert image into editor
      editor.chain().focus().setImage({ src: fileUrl }).run();

    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  /**
   * Trigger file input click
   */
  function openFilePicker() {
    fileInputRef.current?.click();
  }

  /**
   * Handle file selection
   */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    handleImageUpload(file);

    // Reset input
    e.target.value = "";
  }

  if (!editor) return null;

  return (
    <div className="rich-editor">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="rich-toolbar">
        {/* Paragraph / Headings */}
        <select
          className="toolbar-select"
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 })
                .run();
            }
          }}
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        {/* Font family */}
        <select
          className="toolbar-select"
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

        {/* Text color */}
        <input
          type="color"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
          title="Text Color"
        />

        {/* Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
          title="Underline"
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive("highlight") ? "is-active" : ""}
          title="Highlight"
        >
          HL
        </button>

        {/* Image upload button */}
        <button
          onClick={openFilePicker}
          disabled={uploading}
          title="Insert Image"
          className="image-button"
        >
          {uploading ? "⏳" : "🖼️"}
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}