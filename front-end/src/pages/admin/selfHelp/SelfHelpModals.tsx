import { useState, useEffect, useRef } from "react";
import { api } from "../../../api/client";
import RichEditor from "../../../components/RichEditor/RichEditor";
import AdminRichEditorModal from "../../../components/AdminRichEditorModal/AdminRichEditorModal";
import type { SelfHelp } from "../admin.types";
import "../materials/materials.css";

// ---------------------------------------------------------------------------
// Shared thumbnail uploader (same logic as MaterialModals)
// ---------------------------------------------------------------------------

interface ThumbnailUploaderProps {
  value: string;
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
      const presignRes = await api.post<{ uploadUrl: string; fileUrl: string }>(
        "/admin/uploads/thumbnail-presign",
        { filename: file.name, contentType: file.type }
      );
      const { uploadUrl, fileUrl } = presignRes.data;

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
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Self-Help modal
// ---------------------------------------------------------------------------

interface AddSelfHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    author: string;
    content: string;
    subscriberOnly: boolean;
    thumbnailUrl: string;
  }) => Promise<void>;
}

export function AddSelfHelpModal({ isOpen, onClose, onCreate }: AddSelfHelpModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const reset = () => {
    setTitle("");
    setAuthor("");
    setContent("");
    setSubscriberOnly(false);
    setThumbnailUrl("");
  };

  const handleCreate = async () => {
    if (!title || !author || !content) {
      alert("All fields required");
      return;
    }
    if (!thumbnailUrl) {
      alert("Please upload a thumbnail before saving.");
      return;
    }

    await onCreate({ title, author, content, subscriberOnly, thumbnailUrl });
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
      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={subscriberOnly}
          onChange={(e) => setSubscriberOnly(e.target.checked)}
        />
        Subscriber-only content
      </label>
      <ThumbnailUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
      <button onClick={handleCreate}>Add Self-Help</button>
    </AdminRichEditorModal>
  );
}

// ---------------------------------------------------------------------------
// Add Google Doc Self-Help modal
// ---------------------------------------------------------------------------

interface AddGoogleDocSelfHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (data: {
    title: string;
    author: string;
    google_doc_url: string;
    subscriberOnly: boolean;
    thumbnailUrl: string;
  }) => Promise<void>;
}

export function AddGoogleDocSelfHelpModal({
  isOpen,
  onClose,
  onSync,
}: AddGoogleDocSelfHelpModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setAuthor("");
    setGoogleDocUrl("");
    setSubscriberOnly(false);
    setThumbnailUrl("");
    setIsSubmitting(false);
  };

  const handleSync = async () => {
    if (!title.trim() || !author.trim() || !googleDocUrl.trim()) {
      alert("Title, author, and Google Doc URL are required");
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
    <AdminRichEditorModal isOpen={isOpen} onClose={onClose} title="Sync Self-Help from Google Doc">
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
// Edit Self-Help modal
// ---------------------------------------------------------------------------

interface EditSelfHelpModalProps {
  selfHelp: SelfHelp | null;
  onClose: () => void;
  onSave: (id: string, data: {
    title: string;
    author: string;
    content: string;
    subscriberOnly: boolean;
    thumbnailUrl?: string;
  }) => Promise<void>;
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
  const [subscriberOnly, setSubscriberOnly] = useState<boolean>(Boolean(selfHelp?.subscriberOnly));
  const [thumbnailUrl, setThumbnailUrl] = useState(selfHelp?.thumbnailUrl || "");
  const [loading, setLoading] = useState(true);

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
    setSubscriberOnly(Boolean(selfHelp.subscriberOnly));
    setThumbnailUrl(selfHelp.thumbnailUrl || "");
  }, [selfHelp]);

  if (!selfHelp) return null;

  const handleSave = async () => {
    await onSave(selfHelp.id, {
      title,
      author,
      content,
      subscriberOnly,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    });
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
