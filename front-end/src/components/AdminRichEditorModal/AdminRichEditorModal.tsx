import { type ReactNode } from "react";
import "./adminRichEditorModal.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function AdminRichEditorModal({
  isOpen,
  onClose,
  title,
  children,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="editor-window-overlay" onClick={onClose}>
      <div className="editor-window" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="editor-window-close" onClick={onClose}>
          ✕
        </button>

        {title ? <h3 className="editor-window-title">{title}</h3> : null}

        <div className="editor-window-body">{children}</div>
      </div>
    </div>
  );
}
