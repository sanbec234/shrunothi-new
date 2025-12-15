type TextDoc = {
  id: string;
  filename: string;
  author: string;
};

export default function TextDocCard({ doc }: { doc: TextDoc }) {
  return (
    <div className="doc-card">
      <div className="doc-title">{doc.filename}</div>
      <div className="doc-author">by {doc.author}</div>
    </div>
  );
}
