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
        const res = await api.get<{ content: string }>(`/material/${doc.id}`);
        if (!mounted) return;
        setContent(res.data.content);
      } catch {
        setContent("Failed to load document.");
      }
    }

    loadContent();
    return () => { mounted = false; };
  }, [doc.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">{doc.title}</h2>
        <p className="modal-author">By {doc.author}</p>
        <div className="modal-body" dangerouslySetInnerHTML={{ __html: content }} />

      </div>
    </div>
  );
}
