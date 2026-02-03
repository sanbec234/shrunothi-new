import { useState, useEffect } from "react";
import RichEditor from "../../../components/RichEditor/RichEditor";
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
          <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
            <option value="">Select genre</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button onClick={handleCreate}>Add Material</button>
        </div>
      </div>
    </div>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>

          {successMessage && <div className="success-banner">{successMessage}</div>}

          <h3>Edit Material</h3>

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

          {loading ? (
            <div>Loading content...</div>
          ) : (
            <RichEditor value={content} onChange={setContent} />
          )}

          <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
            <option value="">Select genre</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}