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
    subscriberOnly: boolean;
  }) => Promise<void>;
}

export function AddMaterialModal({ isOpen, genres, onClose, onCreate }: AddMaterialModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [genreId, setGenreId] = useState("");
  const [subscriberOnly, setSubscriberOnly] = useState(false);

  const reset = () => {
    setTitle("");
    setAuthor("");
    setContent("");
    setGenreId("");
    setSubscriberOnly(false);
  };

  const handleCreate = async () => {
    if (!title || !author || !content || !genreId) {
      alert("All fields required");
      return;
    }

    await onCreate({ title, author, content, genreId, subscriberOnly });
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
      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={subscriberOnly}
          onChange={(e) => setSubscriberOnly(e.target.checked)}
        />
        Subscriber-only content
      </label>
      <button onClick={handleCreate}>Add Material</button>
    </AdminRichEditorModal>
  );
}

interface AddGoogleDocModalProps {
  isOpen: boolean;
  genres: Genre[];
  onClose: () => void;
  onSync: (data: { title: string; author: string; google_doc_url: string; genreId: string; subscriberOnly: boolean }) => Promise<void>;
}

export function AddGoogleDocModal({ isOpen, genres, onClose, onSync }: AddGoogleDocModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [genreId, setGenreId] = useState("");
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setAuthor("");
    setGoogleDocUrl("");
    setGenreId("");
    setSubscriberOnly(false);
    setIsSubmitting(false);
  };

  const handleSync = async () => {
    if (!title.trim() || !author.trim() || !googleDocUrl.trim() || !genreId) {
      alert("Title, author, Google Doc URL, and genre are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSync({
        title: title.trim(),
        author: author.trim(),
        google_doc_url: googleDocUrl.trim(),
        genreId,
        subscriberOnly,
      });
      reset();
      onClose();
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      const apiDetails = err?.response?.data?.details;
      alert(apiDetails ? `${apiError}: ${apiDetails}` : (apiError || "Failed to sync Google Doc"));
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AdminRichEditorModal isOpen={isOpen} onClose={onClose} title="Sync Google Doc">
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
      <input
        placeholder="Google Doc URL"
        value={googleDocUrl}
        onChange={(e) => setGoogleDocUrl(e.target.value)}
      />
      <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
        <option value="">Select genre</option>
        {genres.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={subscriberOnly}
          onChange={(e) => setSubscriberOnly(e.target.checked)}
        />
        Subscriber-only content
      </label>
      <button onClick={handleSync} disabled={isSubmitting}>
        {isSubmitting ? "Syncing..." : "Sync Document"}
      </button>
    </AdminRichEditorModal>
  );
}

interface EditMaterialModalProps {
  material: Material | null;
  genres: Genre[];
  onClose: () => void;
  onSave: (
    id: string,
    data: { title: string; author: string; content: string; genreId: string; subscriberOnly: boolean }
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
  const [subscriberOnly, setSubscriberOnly] = useState<boolean>(Boolean(material?.subscriberOnly));
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

        setTitle(material.title || "");
        setAuthor(material.author || "");
        setGenreId(material.genreId || "");
        setSubscriberOnly(Boolean(material.subscriberOnly));
        }, [material]);
    if (!material) return null;

  const handleSave = async () => {
    await onSave(material.id, { title, author, content, genreId, subscriberOnly });
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

      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={subscriberOnly}
          onChange={(e) => setSubscriberOnly(e.target.checked)}
        />
        Subscriber-only content
      </label>

      <button onClick={handleSave}>Save</button>
    </AdminRichEditorModal>
  );
}
