import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import type { Level } from "@tiptap/extension-heading";

import "./richEditor.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function RichEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
        StarterKit,
        Highlight,
        TextStyle,
        Color,
    ],
    content: value || "",
    onUpdate({ editor }) {
        onChange(editor.getHTML());
    },
    });

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        {/* Headings */}
        <select
            onChange={(e) => {
                const value = Number(e.target.value);

                if (value === 0) {
                editor.chain().focus().setParagraph().run();
                } else {
                editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: value as Level })
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
            onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
            }
        >
            <option value="">Default</option>
            <option value="Inter">Inter</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times</option>
            <option value="monospace">Monospace</option>
        </select>

        {/* Text color */}
        <input
            type="color"
            onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
            }
        />

        {/* Formatting */}
        <button onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button onClick={() => editor.chain().focus().toggleHighlight().run()}>
            HL
        </button>
        </div>

      <EditorContent editor={editor} />
    </div>
  );
}