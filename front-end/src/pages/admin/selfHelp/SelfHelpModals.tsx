import { useState, useEffect } from "react";
import RichEditor from "../../../components/RichEditor/RichEditor";
import type { SelfHelp } from "../admin.types";

interface AddSelfHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; author: string; content: string }) => Promise<void>;
}

export function AddSelfHelpModal({ isOpen, onClose, onCreate }: AddSelfHelpModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  const reset = () => {
    setTitle("");
    setAuthor("");
    setContent("");
  };

  const handleCreate = async () => {
    if (!title || !author || !content) {
      alert("All fields required");
      return;
    }

    await onCreate({ title, author, content });
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <RichEditor value={content} onChange={setContent} />
          <button onClick={handleCreate}>Add Self-Help</button>
        </div>
      </div>
    </div>
  );
}

interface EditSelfHelpModalProps {
  selfHelp: SelfHelp | null;
  onClose: () => void;
  onSave: (id: string, data: { title: string; author: string; content: string }) => Promise<void>;
  fetchContent: (id: string) => Promise<string>;
}

export function EditSelfHelpModal({
  selfHelp,
  onClose,
  onSave,
  fetchContent,
}: EditSelfHelpModalProps) {
  const [title, setTitle] = useState(selfHelp?.title || "");
  const [author, setAuthor] = useState(selfHelp?.author || "");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch content when modal opens
  useEffect(() => {
    if (!selfHelp) return;

    setLoading(true);
    fetchContent(selfHelp.id).then((data) => {
        setContent(data);
        setLoading(false);
    });
    }, [selfHelp?.id]);

  useEffect(() => {
    if (!selfHelp) return;

    setTitle(selfHelp.title);
    setAuthor(selfHelp.author);
    }, [selfHelp]);

  if (!selfHelp) return null;

  const handleSave = async () => {
    await onSave(selfHelp.id, { title, author, content });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>

          <h3>Edit Self-Help</h3>

          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />

          {loading ? (
            <div>Loading content...</div>
          ) : (
            <RichEditor value={content} onChange={setContent} />
          )}

          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}