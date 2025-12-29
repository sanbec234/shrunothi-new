import { useState, useEffect } from "react";
import "./admindash.css";
import { api } from "../api/client";

/* ---------- Types ---------- */

type Genre = { id: string; name: string };

type Podcast = {
  id: string;
  title: string;
  author: string;
  spotifyUrl: string;
  genreId: string;
};

type Material = {
  id: string;
  title: string;
  author: string;
  content: string;
  genreId: string;
};

type SelfHelp = {
  id: string;
  title: string;
  author: string;
  content: string;
};

/* ---------- Helpers ---------- */

// const uid = () => crypto.randomUUID();

/* ---------- Component ---------- */

export default function AdminDashboard() {

  const user = JSON.parse(localStorage.getItem("authUser") || "null");

  const [users, setUsers] = useState<any[]>([]);

  // ---- Admin Emails ----
  const [adminEmails, setAdminEmails] = useState<{ id: string; email: string }[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  /* ================= DATA ================= */

  const [genres, setGenres] = useState<Genre[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selfHelps, setSelfHelps] = useState<SelfHelp[]>([]);

  /* ================= SECTION TOGGLES ================= */

  const [genresOpen, setGenresOpen] = useState(true);
  const [podcastsOpen, setPodcastsOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [selfHelpOpen, setSelfHelpOpen] = useState(false);

  /* ================= ADD GENRE (WIZARD) ================= */

  const [showAddGenre, setShowAddGenre] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [genreName, setGenreName] = useState("");

  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastAuthor, setPodcastAuthor] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialAuthor, setMaterialAuthor] = useState("");
  const [materialContent, setMaterialContent] = useState("");

  /* ================= ADD PODCAST ================= */

  const [showAddPodcast, setShowAddPodcast] = useState(false);
  const [newPodcastTitle, setNewPodcastTitle] = useState("");
  const [newPodcastAuthor, setNewPodcastAuthor] = useState("");
  const [newSpotifyUrl, setNewSpotifyUrl] = useState("");
  const [podcastGenreId, setPodcastGenreId] = useState("");

  /* ================= ADD MATERIAL ================= */

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialAuthor, setNewMaterialAuthor] = useState("");
  const [newMaterialContent, setNewMaterialContent] = useState("");
  const [materialGenreId, setMaterialGenreId] = useState("");

  /* ================= ADD SELF-HELP ================= */

  const [showAddSelfHelp, setShowAddSelfHelp] = useState(false);
  const [newSelfHelpTitle, setNewSelfHelpTitle] = useState("");
  const [newSelfHelpAuthor, setNewSelfHelpAuthor] = useState("");
  const [newSelfHelpContent, setNewSelfHelpContent] = useState("");
  /* ================= EDIT GENRE ================= */
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [editGenreName, setEditGenreName] = useState("");

  /* ================= EDIT PODCAST ================= */
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [editPodcastTitle, setEditPodcastTitle] = useState("");
  const [editPodcastAuthor, setEditPodcastAuthor] = useState("");
  const [editSpotifyUrl, setEditSpotifyUrl] = useState("");
  const [editPodcastGenreId, setEditPodcastGenreId] = useState("");

  /* ================= EDIT MATERIAL ================= */
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editMaterialTitle, setEditMaterialTitle] = useState("");
  const [editMaterialAuthor, setEditMaterialAuthor] = useState("");
  const [editMaterialContent, setEditMaterialContent] = useState("");
  const [editMaterialGenreId, setEditMaterialGenreId] = useState("");

  /* ================= EDIT SELF HELP ================= */
  const [editingSelfHelp, setEditingSelfHelp] = useState<SelfHelp | null>(null);
  const [editSelfHelpTitle, setEditSelfHelpTitle] = useState("");
  const [editSelfHelpAuthor, setEditSelfHelpAuthor] = useState("");
  const [editSelfHelpContent, setEditSelfHelpContent] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /* ================= FILTER DATA ================= */
  const [podcastGenreFilter, setPodcastGenreFilter] = useState<string>("all");
  const [materialGenreFilter, setMaterialGenreFilter] = useState<string>("all");

  useEffect(() => {
    async function loadGenres() {
      const res = await api.get("/genres");
      setGenres(res.data);
    }

    loadGenres();
  }, []);

  useEffect(() => {
    async function loadPodcasts() {
      try {
        const res = await api.get("/podcasts");
        setPodcasts(res.data);
      } catch (err) {
        console.error("Failed to load podcasts", err);
      }
    }

    loadPodcasts();
  }, []);

  useEffect(() => {
    async function loadMaterials() {
      try {
        const res = await api.get("/materials");
        setMaterials(res.data);
      } catch (err) {
        console.error("Failed to load materials", err);
      }
    }

    loadMaterials();
  }, []);

  useEffect(() => {
    async function loadSelfHelp() {
      try {
        const res = await api.get("/self-help");
        setSelfHelps(res.data);
      } catch (err) {
        console.error("Failed to load self-help", err);
      }
    }

    loadSelfHelp();
  }, []);

  useEffect(() => {
    loadAdminEmails();
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  /* ================= HELPERS ================= */

  function resetGenreWizard() {
    setStep(1);
    setGenreName("");
    setPodcastTitle("");
    setPodcastAuthor("");
    setSpotifyUrl("");
    setMaterialTitle("");
    setMaterialAuthor("");
    setMaterialContent("");
  }

  function closeGenreModal() {
    setShowAddGenre(false);
    resetGenreWizard();
  }

  const visiblePodcasts =
  podcastGenreFilter === "all"
    ? podcasts
    : podcasts.filter((p) => p.genreId === podcastGenreFilter);

  const visibleMaterials =
  materialGenreFilter === "all"
    ? materials
    : materials.filter((m) => m.genreId === materialGenreFilter);

  /* ================= LOAD ADMIN EMAILS ================= */
  async function loadAdminEmails() {
    try {
      const res = await api.get("/admin/admin-emails");
      setAdminEmails(res.data);
    } catch (err) {
      console.error("Failed to load admin emails", err);
    }
  }
  

  async function createGenreBundle() {
    try {
      // 1️⃣ Create genre
      const genreRes = await api.post("/admin/genres", { name: genreName });
      const genreId = genreRes.data.id;

      // 2️⃣ Create podcast (only if filled)
      if (podcastTitle && podcastAuthor && spotifyUrl) {
        await api.post("/admin/podcasts", {
          title: podcastTitle,
          author: podcastAuthor,
          spotifyUrl,
          genreId
        });
      }

      // 3️⃣ Create material (only if filled)
      if (materialTitle && materialAuthor && materialContent) {
        await api.post("/admin/materials", {
          title: materialTitle,
          author: materialAuthor,
          content: materialContent,
          genreId
        });
      }

      // 🔁 4️⃣ REFRESH ALL DATA
      const [gRes, pRes, mRes] = await Promise.all([
        api.get("/genres"),
        api.get("/podcasts"),
        api.get("/materials")
      ]);

      setGenres(gRes.data);
      setPodcasts(pRes.data);
      setMaterials(mRes.data);

      // 5️⃣ Close modal
      closeGenreModal();

    } catch (err) {
      console.error(err);
      alert("Failed to create genre bundle");
    }
  }


  async function addPodcast() {
    if (!newPodcastTitle || !newPodcastAuthor || !newSpotifyUrl || !podcastGenreId) {
      alert("All fields required");
      return;
    }

    try {
      await api.post("/admin/podcasts", {
        title: newPodcastTitle,
        author: newPodcastAuthor,
        spotifyUrl: newSpotifyUrl,
        genreId: podcastGenreId
      });

      // re-fetch podcasts
      const podsRes = await api.get("/podcasts");
      setPodcasts(podsRes.data);

      setShowAddPodcast(false);
      setNewPodcastTitle("");
      setNewPodcastAuthor("");
      setNewSpotifyUrl("");
      setPodcastGenreId("");

    } catch (err) {
      console.error(err);
      alert("Error adding podcast");
    }
  }

  async function addMaterial() {
    if (!newMaterialTitle || !newMaterialAuthor || !newMaterialContent || !materialGenreId) {
      alert("All fields required");
      return;
    }

    try {
      await api.post("/admin/materials", {
        title: newMaterialTitle,
        author: newMaterialAuthor,
        content: newMaterialContent,
        genreId: materialGenreId
      });

      const matsRes = await api.get("/materials");
      setMaterials(matsRes.data);

      setShowAddMaterial(false);
      setNewMaterialTitle("");
      setNewMaterialAuthor("");
      setNewMaterialContent("");
      setMaterialGenreId("");

    } catch (err) {
      console.error(err);
      alert("Error adding material");
    }
  }

  async function addSelfHelp() {
    if (!newSelfHelpTitle || !newSelfHelpAuthor || !newSelfHelpContent) {
      alert("All fields required");
      return;
    }

    try {
      await api.post("/admin/self-help", {
        title: newSelfHelpTitle,
        author: newSelfHelpAuthor,
        content: newSelfHelpContent
      });

      const shRes = await api.get("/self-help");
      setSelfHelps(shRes.data);

      setShowAddSelfHelp(false);
      setNewSelfHelpTitle("");
      setNewSelfHelpAuthor("");
      setNewSelfHelpContent("");

    } catch (err) {
      console.error(err);
      alert("Error adding self-help");
    }
  }

  async function addAdminEmail() {
    if (!newAdminEmail.trim()) return;

    try {
      await api.post("/admin/admin-emails", { email: newAdminEmail.trim() });
      await loadAdminEmails();
      setNewAdminEmail("");
      setShowAddAdmin(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to add admin");
    }
  }

  async function deleteAdminEmail(id: string) {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this admin?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/admin-emails/${id}`);
      await loadAdminEmails();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete admin");
    }
  }

  async function loadUsers() {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  }
  
  const podcastCount = (id: string) =>
    podcasts.filter((p) => p.genreId === id).length;

  const materialCount = (id: string) =>
    materials.filter((m) => m.genreId === id).length;

  /* ================= UI ================= */

  return (
    <div className="admin">
      <img src="./logo.png" alt="shrunothi logo" className="admin-dash-logo"/>
      <h2>Admin Dashboard</h2>

      {/* ================= GENRES ================= */}
      <section>
        <div className="section-header open" onClick={() => setGenresOpen(!genresOpen)}>
          <span>▶</span> 
          Genres
        </div> 

        {genresOpen && (
          <>
            <button onClick={() => setShowAddGenre(true)}>+ Add Genre</button>
            <div className="section-body">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Podcasts</th>
                    <th>Materials</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {genres.map((g) => (
                    <tr key={g.id}>
                      <td  data-label="Name">{g.name}</td>
                      <td  data-label="Podcasts">{podcastCount(g.id)}</td>
                      <td  data-label="Materials">{materialCount(g.id)}</td>
                      <td data-label="Actions">
                        <div className="action-group">
                          <button
                            onClick={() => {
                              setEditingGenre(g);
                              setEditGenreName(g.name);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="danger"
                            onClick={async () => {
                              if (!confirm("Delete this genre?")) return;

                              try {
                                await api.delete(`/admin/genres/${g.id}`);
                                const genresRes = await api.get("/genres");
                                setGenres(genresRes.data);
                              } catch (err: any) {
                                alert(err.response?.data?.error || "Failed to delete genre");
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {genres.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty">No genres yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ================= PODCASTS ================= */}
      <section>
        {/* Header */}
        <div
          className="section-header"
          onClick={() => setPodcastsOpen(!podcastsOpen)}
        >
          <span className={podcastsOpen ? "open" : ""}>▶</span>
          <span>Podcasts</span>
        </div>

        {podcastsOpen && (
          <>
            {/* Controls */}
            <div className="section-controls">
              <button onClick={() => setShowAddPodcast(true)}>
                + Add Podcast
              </button>

              <select
                value={podcastGenreFilter}
                onChange={(e) => setPodcastGenreFilter(e.target.value)}
              >
                <option value="all">All genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Body */}
            <div className="section-body">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visiblePodcasts.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Title">{p.title}</td>
                      <td data-label="Author">{p.author}</td>
                      <td data-label="Genre">
                        {genres.find((g) => g.id === p.genreId)?.name}
                      </td>
                      <td data-label="Actions">
                        <div className="action-group">
                          <button
                            onClick={() => {
                              setEditingPodcast(p);
                              setEditPodcastTitle(p.title);
                              setEditPodcastAuthor(p.author);
                              setEditSpotifyUrl(p.spotifyUrl);
                              setEditPodcastGenreId(p.genreId);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="danger"
                            onClick={async () => {
                              if (!confirm("Delete this podcast?")) return;

                              await api.delete(`/admin/podcasts/${p.id}`);
                              const res = await api.get("/podcasts");
                              setPodcasts(res.data);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visiblePodcasts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty">
                        No podcasts for this genre
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ================= MATERIALS ================= */}
      <section>
        {/* Header */}
        <div
          className="section-header"
          onClick={() => setMaterialsOpen(!materialsOpen)}
        >
          <span className={materialsOpen ? "open" : ""}>▶</span>
          <span>Materials</span>
        </div>

        {materialsOpen && (
          <>
            {/* Controls */}
            <div className="section-controls">
              <button onClick={() => setShowAddMaterial(true)}>
                + Add Material
              </button>

              <select
                value={materialGenreFilter}
                onChange={(e) => setMaterialGenreFilter(e.target.value)}
              >
                <option value="all">All genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Body */}
            <div className="section-body">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleMaterials.map((m) => (
                    <tr key={m.id}>
                      <td data-label="Title">{m.title}</td>
                      <td data-label="Author">{m.author}</td>
                      <td data-label="Genre">
                        {genres.find((g) => g.id === m.genreId)?.name}
                      </td>
                      <td data-label="Actions">
                        <div className="action-group">
                          <button
                            onClick={async () => {
                              setEditingMaterial(m);
                              setEditMaterialTitle(m.title);
                              setEditMaterialAuthor(m.author);
                              setEditMaterialGenreId(m.genreId);

                              // fetch full content
                              const res = await api.get(`/material/${m.id}`);
                              setEditMaterialContent(res.data.content);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="danger"
                            onClick={async () => {
                              if (!confirm("Delete this material?")) return;

                              await api.delete(`/admin/materials/${m.id}`);
                              const res = await api.get("/materials");
                              setMaterials(res.data);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visibleMaterials.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty">
                        No materials for this genre
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ================= SELF-HELP ================= */}
      <section>
        <div className="section-header" onClick={() => setSelfHelpOpen(!selfHelpOpen)}>
          <span>▶</span> Self-Help Guides
        </div>

        {selfHelpOpen && (
          <>
            <button onClick={() => setShowAddSelfHelp(true)}>+ Add Self-Help</button>
            <div className="section-body">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selfHelps.map((s) => (
                    <tr key={s.id}>
                      <td data-label="title">{s.title}</td>
                      <td data-label="author">{s.author}</td>
                      <td data-label="actions">
                        <div className="action-group">
                          <button
                            onClick={async () => {
                              setEditingSelfHelp(s);
                              setEditSelfHelpTitle(s.title);
                              setEditSelfHelpAuthor(s.author);

                              // fetch full content if needed
                              const res = await api.get(`/material/${s.id}`);
                              setEditSelfHelpContent(res.data.content);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="danger"
                            onClick={async () => {
                              if (!confirm("Delete this self-help guide?")) return;

                              await api.delete(`/admin/self-help/${s.id}`);
                              const res = await api.get("/self-help");
                              setSelfHelps(res.data);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {selfHelps.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty">No self-help guides yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      {/* ================= ADMIN EMAILS ================= */}
      <section>
        <h2>Admin Emails</h2>

        <button onClick={() => setShowAddAdmin(true)}>
          + Add Admin Email
        </button>
        <div className="section-body">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {adminEmails.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty">
                    No admin emails added
                  </td>
                </tr>
              ) : (
                adminEmails.map((a) => (
                  <tr key={a.id}>
                    <td  data-label="mail">{a.email}</td>
                    <td  data-label="role">Admin</td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => deleteAdminEmail(a.id)}
                        disabled={a.email === user.email}
                        title={
                          a.email === user.email
                            ? "You cannot remove yourself"
                            : "Remove admin"
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Users</h2>
        <div className="section-body">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>First Login</th>
                <th>Last Login</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    No users yet
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td  data-label="Name">{u.name || "—"}</td>
                    <td  data-label="Email">{u.email}</td>
                    <td  data-label="Role">{u.role}</td>
                    <td data-label="First Login">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td data-label="Last Login">
                      {u.last_login
                        ? new Date(u.last_login).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= ADD GENRE MODAL ================= */}
      {showAddGenre && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={closeGenreModal}>✕</button>

            <div className="step">Step {step} of 3</div>

            {step === 1 && (
              <>
                <input
                  placeholder="Genre name"
                  value={genreName}
                  onChange={(e) => setGenreName(e.target.value)}
                />
                <button disabled={!genreName} onClick={() => setStep(2)}>Next</button>
              </>
            )}

            {step === 2 && (
              <>
                <input
                  placeholder="Podcast title"
                  value={podcastTitle}
                  onChange={(e) => setPodcastTitle(e.target.value)}
                />
                <input
                  placeholder="Podcast author"
                  value={podcastAuthor}
                  onChange={(e) => setPodcastAuthor(e.target.value)}
                />
                <input
                  placeholder="Spotify URL"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                />
                <button onClick={() => setStep(3)}>Next</button>
              </>
            )}

            {step === 3 && (
              <>
                <input
                  placeholder="Material title"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                />
                <input
                  placeholder="Material author"
                  value={materialAuthor}
                  onChange={(e) => setMaterialAuthor(e.target.value)}
                />
                <textarea
                  placeholder="Material content"
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                />
                <button onClick={createGenreBundle}>Create Genre</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= EDIT GENRE MODAL ================= */}
      {editingGenre && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setEditingGenre(null)}
            >
              ✕
            </button>

            <h3>Edit Genre</h3>

            <input
              value={editGenreName}
              onChange={(e) => setEditGenreName(e.target.value)}
              placeholder="Genre name"
            />

            <button
              disabled={!editGenreName.trim()}
              onClick={async () => {
                await api.put(`/admin/genres/${editingGenre.id}`, {
                  name: editGenreName
                });

                // 🔁 refresh genres
                const res = await api.get("/genres");
                setGenres(res.data);

                setEditingGenre(null);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD PODCAST MODAL ================= */}
      {showAddPodcast && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowAddPodcast(false)}>✕</button>
            <input placeholder="Title" value={newPodcastTitle} onChange={(e) => setNewPodcastTitle(e.target.value)} />
            <input placeholder="Author" value={newPodcastAuthor} onChange={(e) => setNewPodcastAuthor(e.target.value)} />
            <input placeholder="Spotify URL" value={newSpotifyUrl} onChange={(e) => setNewSpotifyUrl(e.target.value)} />
            <select value={podcastGenreId} onChange={(e) => setPodcastGenreId(e.target.value)}>
              <option value="">Select genre</option>
              {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button onClick={addPodcast}>Add Podcast</button>
          </div>
        </div>
      )}

      {/* ================= EDIT PODCAST MODAL ================= */}
      {editingPodcast && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setEditingPodcast(null)}
            >
              ✕
            </button>

            {/* ✅ Success message */}
            {successMessage && (
              <div className="success-banner">
                {successMessage}
              </div>
            )}

            <h3>Edit Podcast</h3>

            <input
              value={editPodcastTitle}
              onChange={(e) => setEditPodcastTitle(e.target.value)}
              placeholder="Title"
            />

            <input
              value={editPodcastAuthor}
              onChange={(e) => setEditPodcastAuthor(e.target.value)}
              placeholder="Author"
            />

            <input
              value={editSpotifyUrl}
              onChange={(e) => setEditSpotifyUrl(e.target.value)}
              placeholder="Spotify URL"
            />

            <select
              value={editPodcastGenreId}
              onChange={(e) => setEditPodcastGenreId(e.target.value)}
            >
              <option value="">Select genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <button
              onClick={async () => {
                await api.put(`/admin/podcasts/${editingPodcast.id}`, {
                  title: editPodcastTitle,
                  author: editPodcastAuthor,
                  spotifyUrl: editSpotifyUrl,
                  genreId: editPodcastGenreId
                });

                // ✅ update local state immediately (NO reload)
                setPodcasts((prev) =>
                  prev.map((p) =>
                    p.id === editingPodcast.id
                      ? {
                        ...p,
                        title: editPodcastTitle,
                        author: editPodcastAuthor,
                        spotifyUrl: editSpotifyUrl,
                        genreId: editPodcastGenreId
                      }
                      : p
                  )
                );

                // ✅ success feedback
                setSuccessMessage("Podcast updated successfully");

                // ⏱ close modal
                setTimeout(() => {
                  setEditingPodcast(null);
                  setSuccessMessage("");
                }, 800);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD MATERIAL MODAL ================= */}
      {showAddMaterial && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowAddMaterial(false)}>✕</button>
            <input placeholder="Title" value={newMaterialTitle} onChange={(e) => setNewMaterialTitle(e.target.value)} />
            <input placeholder="Author" value={newMaterialAuthor} onChange={(e) => setNewMaterialAuthor(e.target.value)} />
            <textarea placeholder="Content" value={newMaterialContent} onChange={(e) => setNewMaterialContent(e.target.value)} />
            <select value={materialGenreId} onChange={(e) => setMaterialGenreId(e.target.value)}>
              <option value="">Select genre</option>
              {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button onClick={addMaterial}>Add Material</button>
          </div>
        </div>
      )}
      {/* ================= EDIT MATERIAL MODAL ================= */}
      {editingMaterial && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setEditingMaterial(null)}
            >
              ✕
            </button>

            {successMessage && (
              <div className="success-banner">
                {successMessage}
              </div>
            )}

            <h3>Edit Material</h3>

            <input
              value={editMaterialTitle}
              onChange={(e) => setEditMaterialTitle(e.target.value)}
              placeholder="Title"
            />

            <input
              value={editMaterialAuthor}
              onChange={(e) => setEditMaterialAuthor(e.target.value)}
              placeholder="Author"
            />

            <textarea
              value={editMaterialContent}
              onChange={(e) => setEditMaterialContent(e.target.value)}
              placeholder="Content"
            />

            <select
              value={editMaterialGenreId}
              onChange={(e) => setEditMaterialGenreId(e.target.value)}
            >
              <option value="">Select genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <button
              onClick={async () => {
                await api.put(`/admin/materials/${editingMaterial.id}`, {
                  title: editMaterialTitle,
                  author: editMaterialAuthor,
                  content: editMaterialContent,
                  genreId: editMaterialGenreId
                });

                // ✅ optimistic UI update
                setMaterials((prev) =>
                  prev.map((m) =>
                    m.id === editingMaterial.id
                      ? {
                        ...m,
                        title: editMaterialTitle,
                        author: editMaterialAuthor,
                        content: editMaterialContent,
                        genreId: editMaterialGenreId
                      }
                      : m
                  )
                );

                setSuccessMessage("Material updated successfully");

                setTimeout(() => {
                  setEditingMaterial(null);
                  setSuccessMessage("");
                }, 800);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD SELF-HELP MODAL ================= */}
      {showAddSelfHelp && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowAddSelfHelp(false)}>✕</button>
            <input placeholder="Title" value={newSelfHelpTitle} onChange={(e) => setNewSelfHelpTitle(e.target.value)} />
            <input placeholder="Author" value={newSelfHelpAuthor} onChange={(e) => setNewSelfHelpAuthor(e.target.value)} />
            <textarea placeholder="Content" value={newSelfHelpContent} onChange={(e) => setNewSelfHelpContent(e.target.value)} />
            <button onClick={addSelfHelp}>Add Self-Help</button>
          </div>
        </div>
      )}

      {/* ================= EDIT SELF-HELP MODAL ================= */}
      {editingSelfHelp && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setEditingSelfHelp(null)}
            >
              ✕
            </button>

            <h3>Edit Self-Help</h3>

            <input
              placeholder="Title"
              value={editSelfHelpTitle}
              onChange={(e) => setEditSelfHelpTitle(e.target.value)}
            />

            <input
              placeholder="Author"
              value={editSelfHelpAuthor}
              onChange={(e) => setEditSelfHelpAuthor(e.target.value)}
            />

            <textarea
              placeholder="Content"
              value={editSelfHelpContent}
              onChange={(e) => setEditSelfHelpContent(e.target.value)}
              rows={10}
            />

            <button
              onClick={async () => {
                await api.put(`/admin/self-help/${editingSelfHelp.id}`, {
                  title: editSelfHelpTitle,
                  author: editSelfHelpAuthor,
                  content: editSelfHelpContent
                });

                // 🔁 Refresh self-help list (no reload)
                const res = await api.get("/self-help");
                setSelfHelps(res.data);

                setEditingSelfHelp(null);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {showAddAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setShowAddAdmin(false)}
            >
              ✕
            </button>

            <h3>Add Admin Email</h3>

            <input
              placeholder="admin@email.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
            <button onClick={addAdminEmail}>
              Add
            </button>

          </div>
        </div>
      )}
    </div>
  );
}