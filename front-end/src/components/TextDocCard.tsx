import type { TextDoc } from "../types";

type Props = {
  doc: TextDoc;
  onClick?: () => void;
};

export default function TextDocCard({ doc, onClick }: Props) {
  return (
    <div className="doc-card" onClick={onClick}>
      <div className="doc-title">{doc.filename}</div>
      <div className="doc-author">{doc.author}</div>
    </div>
  );
}
