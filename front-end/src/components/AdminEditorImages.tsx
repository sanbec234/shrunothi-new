import { useEffect, useState } from "react";
import { api } from "../api/client";

type EditorImage = {
  id: string;
  imageUrl: string;
  filename: string;
  contentType: string;
  uploadedAt: string;
};

export default function AdminEditorImages() {
  const [images, setImages] = useState<EditorImage[]>([]);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Search/filter
  const [searchTerm, setSearchTerm] = useState("");

  /* =========================
     Load images
  ========================= */
  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    try {
      setLoading(true);
      const res = await api.get<EditorImage[]>("/admin/editor/images");
      setImages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load editor images", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     File selection
  ========================= */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validate file type
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (f.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  /* cleanup preview URL */
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* =========================
     Upload to S3
  ========================= */
  async function uploadToS3(file: File): Promise<string> {
    // 1️⃣ Get presigned URL
    const res = await api.post("/admin/editor/upload-image", {
      filename: file.name,
      contentType: file.type || "image/jpeg",
    });

    const { uploadUrl, fileUrl } = res.data;

    // 2️⃣ Upload directly to S3
    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    });

    // 3️⃣ Return public URL
    return fileUrl;
  }

  /* =========================
     Add image
  ========================= */
  async function handleAddImage() {
    if (!file) {
      alert("Please select an image");
      return;
    }

    try {
      setUploading(true);

      // 1️⃣ Upload image to S3
      const imageUrl = await uploadToS3(file);

      // 2️⃣ Save metadata to MongoDB
      const res = await api.post<EditorImage>("/admin/editor/images", {
        imageUrl,
        filename: file.name,
        contentType: file.type,
      });

      // 3️⃣ Update UI
      setImages((prev) => [res.data, ...prev]);

      // 4️⃣ Reset form
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  /* =========================
     Delete image
  ========================= */
  async function deleteImage(id: string, _imageUrl: string) {
    if (!confirm("Delete this image? This will NOT remove it from existing materials.")) return;

    try {
      await api.delete(`/admin/editor/images/${id}`);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete image");
    }
  }

  /* =========================
     Copy URL to clipboard
  ========================= */
  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      alert("URL copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy URL", err);
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      alert("URL copied to clipboard!");
    }
  }

  /* =========================
     Filter images
  ========================= */
  const filteredImages = images.filter((img) =>
    img.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* =========================
     Format file size
  ========================= */
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  /* =========================
     Render
  ========================= */
  return (
    <section>
      <h2>Editor Images ({images.length})</h2>

      {/* -------- Upload new image -------- */}
      <div className="image-upload-form">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
          </div>
        )}

        <button onClick={handleAddImage} disabled={uploading || !file}>
          {uploading ? "Uploading…" : "Upload Image"}
        </button>
      </div>

      {/* -------- Search -------- */}
      <div className="section-controls">
        <input
          type="text"
          placeholder="Search by filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, marginBottom: 0 }}
        />
      </div>

      {/* -------- Image grid -------- */}
      {loading ? (
        <div className="empty">Loading images...</div>
      ) : filteredImages.length === 0 ? (
        <div className="empty">
          {searchTerm ? "No images match your search" : "No images uploaded yet"}
        </div>
      ) : (
        <div className="editor-images-grid">
          {filteredImages.map((img) => (
            <div key={img.id} className="editor-image-card">
              <div className="image-thumbnail">
                <img src={img.imageUrl} alt={img.filename} />
              </div>

              <div className="image-info">
                <div className="image-filename" title={img.filename}>
                  {img.filename}
                </div>
                <div className="image-meta">
                  {formatDate(img.uploadedAt)}
                </div>
              </div>

              <div className="image-actions">
                <button
                  className="secondary"
                  onClick={() => copyUrl(img.imageUrl)}
                  title="Copy URL"
                >
                  📋 Copy URL
                </button>
                <button
                  className="secondary"
                  onClick={() => window.open(img.imageUrl, "_blank")}
                  title="View full size"
                >
                  👁️ View
                </button>
                <button
                  className="danger"
                  onClick={() => deleteImage(img.id, img.imageUrl)}
                  title="Delete"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}