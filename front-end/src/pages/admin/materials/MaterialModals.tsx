import { useState, useEffect, useRef } from "react";
import { api } from "../../../api/client";
import RichEditor from "../../../components/RichEditor/RichEditor";
import AdminRichEditorModal from "../../../components/AdminRichEditorModal/AdminRichEditorModal";
import type { Genre, Material } from "../admin.types";
import "./materials.css";

// ---------------------------------------------------------------------------
// Shared thumbnail uploader
// ---------------------------------------------------------------------------

interface ThumbnailUploaderProps {
  value: string;           // current S3 URL (or "" if not yet uploaded)
  onChange: (url: string) => void;
}

function ThumbnailUploader({ value, onChange }: ThumbnailUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }

    setUploading(true);
    try {
      // 1. Get a presigned URL from our dedicated thumbnail endpoint
      const presignRes = await api.post<{ uploadUrl: string; fileUrl: string }>(
        "/admin/uploads/thumbnail-presign",
        { filename: file.name, contentType: file.type }
      );
      const { uploadUrl, fileUrl } = presignRes.data;

      // 2. PUT the file directly to S3
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      onChange(fileUrl);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="thumbnail-uploader">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <label className="thumbnail-uploader__label">Thumbnail *</label>
        <span style={{ fontSize: "0.75rem", color: "var(--muted, #888)" }}>
          (Recommended: 570×456px for materials, 570×570px for guides)
        </span>
      </div>

      {value ? (
        <div className="thumbnail-uploader__preview">
          <img src={value} alt="Thumbnail preview" className="thumbnail-uploader__img" />
          <button
            type="button"
            className="thumbnail-uploader__change"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Change image"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="thumbnail-uploader__pick"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload thumbnail"}
        </button>
      )}

      {error && <p className="thumbnail-uploader__error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";          // allow re-selecting the same file
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Material modal
// ---------------------------------------------------------------------------

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
    thumbnailUrl: string;
  }) => Promise<void>;
}

export function AddMaterialModal({ isOpen, genres, onClose, onCreate }: AddMaterialModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [genreId, setGenreId] = useState("");
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const reset = () => {
    setTitle("");
    setAuthor("");
    setContent("");
    setGenreId("");
    setSubscriberOnly(false);
    setThumbnailUrl("");
  };

  const handleCreate = async () => {
    if (!title || !author || !content || !genreId) {
      alert("All fields required");
      return;
    }
    if (!thumbnailUrl) {
      alert("Please upload a thumbnail before saving.");
      return;
    }

    await onCreate({ title, author, content, genreId, subscriberOnly, thumbnailUrl });
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
      <ThumbnailUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
      <button onClick={handleCreate}>Add Material</button>
    </AdminRichEditorModal>
  );
}

// ---------------------------------------------------------------------------
// Add Google Doc modal
// ---------------------------------------------------------------------------

interface AddGoogleDocModalProps {
  isOpen: boolean;
  genres: Genre[];
  onClose: () => void;
  onSync: (data: {
    title: string;
    author: string;
    google_doc_url: string;
    genreId: string;
    subscriberOnly: boolean;
    thumbnailUrl: string;
  }) => Promise<void>;
}

export function AddGoogleDocModal({ isOpen, genres, onClose, onSync }: AddGoogleDocModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [genreId, setGenreId] = useState("");
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setAuthor("");
    setGoogleDocUrl("");
    setGenreId("");
    setSubscriberOnly(false);
    setThumbnailUrl("");
    setIsSubmitting(false);
  };

  const handleSync = async () => {
    if (!title.trim() || !author.trim() || !googleDocUrl.trim() || !genreId) {
      alert("Title, author, Google Doc URL, and genre are required");
      return;
    }
    if (!thumbnailUrl) {
      alert("Please upload a thumbnail before syncing.");
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
        thumbnailUrl,
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
      <ThumbnailUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
      <button onClick={handleSync} disabled={isSubmitting}>
        {isSubmitting ? "Syncing..." : "Sync Document"}
      </button>
    </AdminRichEditorModal>
  );
}

// ---------------------------------------------------------------------------
// Edit Material modal
// ---------------------------------------------------------------------------

interface EditMaterialModalProps {
  material: Material | null;
  genres: Genre[];
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      title: string;
      author: string;
      content: string;
      genreId: string;
      subscriberOnly: boolean;
      thumbnailUrl?: string;
    }
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
  const [thumbnailUrl, setThumbnailUrl] = useState(material?.thumbnailUrl || "");
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
    setThumbnailUrl(material.thumbnailUrl || "");
  }, [material]);

  if (!material) return null;

  const handleSave = async () => {
    await onSave(material.id, {
      title,
      author,
      content,
      genreId,
      subscriberOnly,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    });
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

      <ThumbnailUploader value={thumbnailUrl} onChange={setThumbnailUrl} />

      <button onClick={handleSave}>Save</button>
    </AdminRichEditorModal>
  );
}
