import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TextDoc } from "../types";

// Generic placeholder shown for materials that have no thumbnail yet.
// Place a real image at /public/thumb-placeholder.jpg to customise it.
const FALLBACK_THUMBNAIL = "/thumb-placeholder.jpg";

type Props = {
  doc: TextDoc;
  onClick?: () => void;
  showPreview?: boolean;
};

function htmlToText(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function TextDocCard({ doc, onClick, showPreview = true }: Props) {
  const [preview, setPreview] = useState<string>("");
  const thumb = doc.thumbnailUrl || FALLBACK_THUMBNAIL;

  useEffect(() => {
    let mounted = true;

    async function loadPreview() {
      try {
        const res = await api.get<{ content: string }>(
          `/material/${doc.id}`
        );

        if (!mounted) return;

        const text = htmlToText(res.data.content);

        const words = text
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .slice(0, 22);

        setPreview(words.join(" ") + "…");
      } catch (err) {
        console.error("Failed to load preview", err);
        setPreview("");
      }
    }

    loadPreview();
    return () => {
      mounted = false;
    };
  }, [doc.id]);

  return (
    <div className="doc-card" onClick={onClick}>
      {/* Thumbnail */}
      <div className="doc-card-thumb">
        <img
          src={thumb}
          alt={doc.title}
          className="doc-card-thumb-img"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMBNAIL;
          }}
        />
      </div>

      <div className="doc-title">{doc.title}</div>
      <div className="doc-author">{doc.author}</div>

      {showPreview && preview && <p className="doc-preview">{preview}</p>}

      <button className="ghost ghost--tight">Read guide</button>
    </div>
  );
}
