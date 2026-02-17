import { useState, useEffect } from "react";
import RichEditor from "../../../components/RichEditor/RichEditor";
import AdminRichEditorModal from "../../../components/AdminRichEditorModal/AdminRichEditorModal";
import type { Genre, Material } from "../admin.types";
import "./materials.css";

interface AddMaterialModalProps {
  isOpen: boolean;
  genres: Genre[];
  onClose: () => void;
  onCreate: (data: {
    title: string;
    author: string;
    content: string;
    genreId: string;
  }) => Promise<void>;
}

export function AddMaterialModal({ isOpen, genres, onClose, onCreate }: AddMaterialModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [genreId, setGenreId] = useState("");

  const reset = () => {
    setTitle("");
    setAuthor("");
    setContent("");
    setGenreId("");
  };

  const handleCreate = async () => {
    if (!title || !author || !content || !genreId) {
      alert("All fields required");
      return;
    }

    await onCreate({ title, author, content, genreId });
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AdminRichEditorModal isOpen={isOpen} onClose={onClose} title="Add Material">
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
      <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
        <option value="">Select genre</option>
        {genres.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <button onClick={handleCreate}>Add Material</button>
    </AdminRichEditorModal>
  );
}

interface EditMaterialModalProps {
  material: Material | null;
  genres: Genre[];
  onClose: () => void;
  onSave: (
    id: string,
    data: { title: string; author: string; content: string; genreId: string }
  ) => Promise<void>;
  fetchContent: (id: string) => Promise<string>;
}

export function EditMaterialModal({
  material,
  genres,
  onClose,
  onSave,
  fetchContent,
}: EditMaterialModalProps) {
  const [title, setTitle] = useState(material?.title || "");
  const [author, setAuthor] = useState(material?.author || "");
  const [content, setContent] = useState("");
  const [genreId, setGenreId] = useState(material?.genreId || "");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch content when modal opens
  useEffect(() => {
    if (!material) return;

    setLoading(true);
    fetchContent(material.id).then((data) => {
        setContent(data);
        setLoading(false);
    });
    }, [material?.id]);

    useEffect(() => {
        if (!material) return;

        setTitle(material.title);
        setAuthor(material.author);
        setGenreId(material.genreId);
        }, [material]);
    if (!material) return null;

  const handleSave = async () => {
    await onSave(material.id, { title, author, content, genreId });
    setSuccessMessage("Material updated successfully");

    setTimeout(() => {
      onClose();
      setSuccessMessage("");
    }, 800);
  };

  return (
    <AdminRichEditorModal isOpen={Boolean(material)} onClose={onClose} title="Edit Material">
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />

      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Author"
      />

      <div className="editor-window-editor">
        {loading ? (
          <div>Loading content...</div>
        ) : (
          <RichEditor value={content} onChange={setContent} />
        )}
      </div>

      <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
        <option value="">Select genre</option>
        {genres.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <button onClick={handleSave}>Save</button>
    </AdminRichEditorModal>
  );
}
