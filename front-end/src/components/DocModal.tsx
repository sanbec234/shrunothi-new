import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TextDoc } from "../types";

type Props = {
  doc: TextDoc;
  onClose: () => void;
};

export default function DocModal({ doc, onClose }: Props) {
  const [content, setContent] = useState<string>("Loading…");

  useEffect(() => {
    let mounted = true;

    async function loadContent() {
      try {
        const res = await api.get<{ content: string }>(
          `/material/${doc.id}`
        );
        if (!mounted) return;
        setContent(res.data.content);
      } catch (err) {
        console.error("Failed to load document", err);
        setContent("Failed to load document.");
      }
    }

    loadContent();
    return () => {
      mounted = false;
    };
  }, [doc.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✨ Brand logo */}
        <div className="modal-header">
          <img
            src="/logo.png"
            alt="Shrunothi"
            className="modal-logo-inline"
          />

          <div className="modal-meta">
            <h2 className="modal-title">{doc.title}</h2>
            <p className="modal-author">By {doc.author}</p>
          </div>
        </div>

        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {/* <h2 className="modal-title">{doc.title}</h2>
        <p className="modal-author">By {doc.author}</p> */}
        <div className="scroll-hint">Scroll to read more ↓</div>
        <div
          className="modal-body tiptap-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
