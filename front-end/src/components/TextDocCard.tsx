import type { TextDoc } from "../types";

const FALLBACK_THUMBNAIL = "/material-1.jpg";

type Props = {
  doc: TextDoc;
  onClick?: () => void;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function TextDocCard({ doc, onClick }: Props) {
  const preview = doc.preview ? stripHtml(doc.preview).slice(0, 120) + "…" : "";
  const thumb = doc.thumbnailUrl || FALLBACK_THUMBNAIL;

  return (
    <div className="doc-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
      <div className="doc-card-thumb">
        <img
          src={thumb}
          alt={doc.title}
          className="doc-card-thumb-img"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMBNAIL; }}
        />
      </div>

      <div className="doc-card-body">
        <p className="doc-title">{doc.title}</p>
        <p className="doc-author">{doc.author}</p>
        {preview && <p className="doc-preview">{preview}</p>}

        <button className="doc-read-btn" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
          Read More
        </button>
      </div>
    </div>
  );
}
