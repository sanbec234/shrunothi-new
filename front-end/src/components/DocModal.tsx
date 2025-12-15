import type { TextDoc } from "../types";

type Props = {
  doc: TextDoc;
  onClose: () => void;
};

export default function DocModal({ doc, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">{doc.filename}</h2>
        <p className="modal-author">By {doc.author}</p>

        <div className="modal-body">
          <p>
            Preview / summary goes here.
            Later this can be full content or fetched on demand.
          </p>
        </div>
      </div>
    </div>
  );
}
