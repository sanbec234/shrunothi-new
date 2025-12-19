const API_BASE = "http://localhost:5001";
import { useState, useEffect } from "react";
import "./admindash.css";

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

const uid = () => crypto.randomUUID();

/* ---------- Component ---------- */

export default function AdminDashboard() {
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

   useEffect(() => {
    async function loadGenres() {
      const res = await fetch("http://localhost:5001/genres");
      const data = await res.json();
      setGenres(data);
    }

    loadGenres();
  }, []);

  useEffect(() => {
    async function loadPodcasts() {
      try {
        const res = await fetch(`${API_BASE}/podcasts`);
        const data = await res.json();
        setPodcasts(data);
      } catch (err) {
        console.error("Failed to load podcasts", err);
      }
    }

    loadPodcasts();
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

  // function createGenre() {
  //   const genreId = uid();

  //   setGenres((g) => [...g, { id: genreId, name: genreName }]);
  //   setPodcasts((p) => [
  //     ...p,
  //     {
  //       id: uid(),
  //       title: podcastTitle,
  //       author: podcastAuthor,
  //       spotifyUrl,
  //       genreId
  //     }
  //   ]);
  //   setMaterials((m) => [
  //     ...m,
  //     {
  //       id: uid(),
  //       title: materialTitle,
  //       author: materialAuthor,
  //       content: materialContent,
  //       genreId
  //     }
  //   ]);

  //   closeGenreModal();
  // }
  async function createGenre() {
    try {
      const res = await fetch("http://localhost:5001/admin/genres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: genreName })
      });

      if (!res.ok) {
        throw new Error("Failed to create genre");
      }

      // Re-fetch genres from backend (single source of truth)
      const genresRes = await fetch("http://localhost:5001/genres");
      const genresData = await genresRes.json();

      setGenres(genresData);
      closeGenreModal();

    } catch (err) {
      console.error(err);
      alert("Error creating genre");
    }
  }

  // function addPodcast() {
  //   if (!newPodcastTitle || !newPodcastAuthor || !newSpotifyUrl || !podcastGenreId) return;

  //   // setPodcasts((p) => [
  //   //   ...p,
  //   //   {
  //   //     id: uid(),
  //   //     title: newPodcastTitle,
  //   //     author: newPodcastAuthor,
  //   //     spotifyUrl: newSpotifyUrl,
  //   //     genreId: podcastGenreId
  //   //   }
  //   // ]);

  //   setShowAddPodcast(false);
  //   setNewPodcastTitle("");
  //   setNewPodcastAuthor("");
  //   setNewSpotifyUrl("");
  //   setPodcastGenreId("");
  // }
  async function addPodcast() {
    if (!newPodcastTitle || !newPodcastAuthor || !newSpotifyUrl || !podcastGenreId) {
      alert("All fields required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/podcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPodcastTitle,
          author: newPodcastAuthor,
          spotifyUrl: newSpotifyUrl,
          genreId: podcastGenreId
        })
      });

      if (!res.ok) throw new Error("Failed to create podcast");

      // re-fetch podcasts
      const podsRes = await fetch(`${API_BASE}/podcasts`);
      const podsData = await podsRes.json();
      setPodcasts(podsData);

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

  function addMaterial() {
    if (!newMaterialTitle || !newMaterialAuthor || !newMaterialContent || !materialGenreId) return;

    // setMaterials((m) => [
    //   ...m,
    //   {
    //     id: uid(),
    //     title: newMaterialTitle,
    //     author: newMaterialAuthor,
    //     content: newMaterialContent,
    //     genreId: materialGenreId
    //   }
    // ]);

    setShowAddMaterial(false);
    setNewMaterialTitle("");
    setNewMaterialAuthor("");
    setNewMaterialContent("");
    setMaterialGenreId("");
  }

  function addSelfHelp() {
    if (!newSelfHelpTitle || !newSelfHelpAuthor || !newSelfHelpContent) return;

    setSelfHelps((s) => [
      ...s,
      {
        id: uid(),
        title: newSelfHelpTitle,
        author: newSelfHelpAuthor,
        content: newSelfHelpContent
      }
    ]);

    setShowAddSelfHelp(false);
    setNewSelfHelpTitle("");
    setNewSelfHelpAuthor("");
    setNewSelfHelpContent("");
  }

  const podcastCount = (id: string) =>
    podcasts.filter((p) => p.genreId === id).length;

  const materialCount = (id: string) =>
    materials.filter((m) => m.genreId === id).length;

  /* ================= UI ================= */

  return (
    <div className="admin">
      <h2>Admin Dashboard</h2>

      {/* ================= GENRES ================= */}
      <section>
        <div className="section-header open" onClick={() => setGenresOpen(!genresOpen)}>
          <span>▶</span> Genres
        </div>

        {genresOpen && (
          <>
            <button onClick={() => setShowAddGenre(true)}>+ Add Genre</button>

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
                    <td>{g.name}</td>
                    <td>{podcastCount(g.id)}</td>
                    <td>{materialCount(g.id)}</td>
                    <td>Edit</td>
                  </tr>
                ))}
                {genres.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">No genres yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* ================= PODCASTS ================= */}
      <section>
        <div className="section-header" onClick={() => setPodcastsOpen(!podcastsOpen)}>
          <span>▶</span> Podcasts
        </div>

        {podcastsOpen && (
          <>
            <button onClick={() => setShowAddPodcast(true)}>+ Add Podcast</button>

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
                {podcasts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.author}</td>
                    <td>{genres.find((g) => g.id === p.genreId)?.name}</td>
                    <td>Edit</td>
                  </tr>
                ))}
                {podcasts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">No podcasts yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* ================= MATERIALS ================= */}
      <section>
        <div className="section-header" onClick={() => setMaterialsOpen(!materialsOpen)}>
          <span>▶</span> Materials
        </div>

        {materialsOpen && (
          <>
            <button onClick={() => setShowAddMaterial(true)}>+ Add Material</button>

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
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.title}</td>
                    <td>{m.author}</td>
                    <td>{genres.find((g) => g.id === m.genreId)?.name}</td>
                    <td>Edit</td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">No materials yet</td>
                  </tr>
                )}
              </tbody>
            </table>
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
                    <td>{s.title}</td>
                    <td>{s.author}</td>
                    <td>Edit</td>
                  </tr>
                ))}
                {selfHelps.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty">No self-help guides yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
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
                <button onClick={createGenre}>Create Genre</button>
              </>
            )}
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
    </div>
  );
}
