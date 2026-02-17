import { useState, useEffect } from "react";
import RichEditor from "../../../components/RichEditor/RichEditor";
import AdminRichEditorModal from "../../../components/AdminRichEditorModal/AdminRichEditorModal";
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
    <AdminRichEditorModal isOpen={isOpen} onClose={onClose} title="Add Self-Help">
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
      <div className="editor-window-editor">
        <RichEditor value={content} onChange={setContent} />
      </div>
      <button onClick={handleCreate}>Add Self-Help</button>
    </AdminRichEditorModal>
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
    <AdminRichEditorModal isOpen={Boolean(selfHelp)} onClose={onClose} title="Edit Self-Help">
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

      <div className="editor-window-editor">
        {loading ? (
          <div>Loading content...</div>
        ) : (
          <RichEditor value={content} onChange={setContent} />
        )}
      </div>

      <button onClick={handleSave}>Save</button>
    </AdminRichEditorModal>
  );
}
