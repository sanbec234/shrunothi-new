import { useEffect, useState } from "react";
import { api } from "../../../api/client";
import "./adminannouncements.css";
type Announcement = {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
};

export default function AdminAnnouncements() {
  // console.log("[useAdminAnnouncements] hook initialized");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [loading, setLoading] = useState(false);

  /* =========================
     Load announcements
  ========================= */
  useEffect(() => {
    async function loadAnnouncements() {
      try {
        // console.log("[useAdminAnnouncements] useEffect triggered");
        const res = await api.get<Announcement[]>("/admin/announcements");
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load announcements", err);
      }
    }
    // console.log("[useAdminAnnouncements] loadAnnouncements CALLED");
    loadAnnouncements();
  }, []);

  /* =========================
     File selection
  ========================= */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

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
     Upload to S3 via backend
  ========================= */
  async function uploadToS3(file: File): Promise<string> {
    // 1️⃣ Ask backend for presigned URL
    const res = await api.post("/admin/uploads/presign", {
      filename: file.name,
      contentType: file.type || "image/jpeg",
    });

    const { uploadUrl, fileUrl } = res.data;

    // 2️⃣ Upload directly to S3 (IMPORTANT: Content-Type must match)
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
     Add announcement
  ========================= */
  async function handleAddAnnouncement() {
    if (!title.trim()) {
      alert("Campaign title is required");
      return;
    }

    if (!file) {
      alert("Please select an image");
      return;
    }

    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      alert("End time must be after start time");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Upload image to S3
      const imageUrl = await uploadToS3(file);

      // 2️⃣ Save announcement metadata to backend
      const res = await api.post<Announcement>("/admin/announcements", {
        title: title.trim(),
        imageUrl,
        isActive,
        startAt: startAt || null,
        endAt: endAt || null,
      });

      // 3️⃣ Update UI immediately
      setAnnouncements((prev) => [res.data, ...prev]);

      // 4️⃣ Reset form
      setTitle("");
      setFile(null);
      setPreview(null);
      setIsActive(true);
      setStartAt("");
      setEndAt("");
    } catch (err) {
      console.error(err);
      alert("Failed to add announcement");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Delete announcement
  ========================= */
  async function deleteAnnouncement(id: string) {
    if (!confirm("Delete this announcement?")) return;

    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete announcement");
    }
  }

  /* =========================
     Render
  ========================= */
  return (
    <section>
      <h2>Announcements</h2>

      {/* -------- Add announcement -------- */}
      <div className="announcement-form">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        {preview && (
          <div className="announcement-preview">
            <img src={preview} alt="Preview" />
          </div>
        )}

        <input
          type="text"
          placeholder="Campaign title (e.g. January Course Launch)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
        />

        <input
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
        />

        <button onClick={handleAddAnnouncement} disabled={loading}>
          {loading ? "Uploading…" : "Add Announcement"}
        </button>
      </div>

      {/* -------- Existing announcements -------- */}
      {announcements.length === 0 ? (
        <div className="empty">No announcements yet</div>
      ) : (
        <div className="announcement-list">
          {announcements.map((a) => (
            <div key={a.id} className="announcement-row">
              <img src={a.imageUrl} alt="Poster" />

              <div className="announcement-meta">
                <strong>{a.title}</strong>
                <div>Status: {a.isActive ? "Active" : "Inactive"}</div>
                <div>
                  {a.startAt && `From ${new Date(a.startAt).toLocaleString()}`}
                  {a.endAt && ` → ${new Date(a.endAt).toLocaleString()}`}
                </div>
              </div>

              <button
                className="danger"
                onClick={() => deleteAnnouncement(a.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}