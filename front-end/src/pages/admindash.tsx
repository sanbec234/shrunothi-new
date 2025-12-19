// import { useState } from "react";
// import "./admindash.css";

// /* ---------- Types ---------- */

// type Genre = {
//   id: string;
//   name: string;
// };

// type Podcast = {
//   id: string;
//   title: string;
//   spotifyUrl: string;
//   genreId: string;
// };

// type Material = {
//   id: string;
//   title: string;
//   content: string;
//   genreId: string;
// };

// /* ---------- Helpers ---------- */

// const uid = () => crypto.randomUUID();

// /* ---------- Component ---------- */

// export default function AdminDashboard() {
//   /* ================= DATA ================= */

//   const [genres, setGenres] = useState<Genre[]>([]);
//   const [podcasts, setPodcasts] = useState<Podcast[]>([]);
//   const [materials, setMaterials] = useState<Material[]>([]);

//   /* ================= SECTION TOGGLES ================= */

//   const [genresOpen, setGenresOpen] = useState(true);
//   const [podcastsOpen, setPodcastsOpen] = useState(false);
//   const [materialsOpen, setMaterialsOpen] = useState(false);

//   /* ================= ADD GENRE (WIZARD) ================= */

//   const [showAddGenre, setShowAddGenre] = useState(false);
//   const [step, setStep] = useState<1 | 2 | 3>(1);

//   const [genreName, setGenreName] = useState("");
//   const [podcastTitle, setPodcastTitle] = useState("");
//   const [spotifyUrl, setSpotifyUrl] = useState("");
//   const [materialTitle, setMaterialTitle] = useState("");
//   const [materialContent, setMaterialContent] = useState("");

//   /* ================= ADD PODCAST ================= */

//   const [showAddPodcast, setShowAddPodcast] = useState(false);
//   const [newPodcastTitle, setNewPodcastTitle] = useState("");
//   const [newSpotifyUrl, setNewSpotifyUrl] = useState("");
//   const [selectedPodcastGenreId, setSelectedPodcastGenreId] = useState("");

//   /* ================= ADD MATERIAL ================= */

//   const [showAddMaterial, setShowAddMaterial] = useState(false);
//   const [newMaterialTitle, setNewMaterialTitle] = useState("");
//   const [newMaterialContent, setNewMaterialContent] = useState("");
//   const [selectedMaterialGenreId, setSelectedMaterialGenreId] = useState("");

//   /* ================= HELPERS ================= */

//   function resetGenreWizard() {
//     setStep(1);
//     setGenreName("");
//     setPodcastTitle("");
//     setSpotifyUrl("");
//     setMaterialTitle("");
//     setMaterialContent("");
//   }

//   function closeGenreModal() {
//     setShowAddGenre(false);
//     resetGenreWizard();
//   }

//   function createGenreFlow() {
//     const genreId = uid();

//     setGenres((prev) => [...prev, { id: genreId, name: genreName }]);
//     setPodcasts((prev) => [
//       ...prev,
//       { id: uid(), title: podcastTitle, spotifyUrl, genreId }
//     ]);
//     setMaterials((prev) => [
//       ...prev,
//       { id: uid(), title: materialTitle, content: materialContent, genreId }
//     ]);

//     closeGenreModal();
//   }

//   function addPodcast() {
//     if (!newPodcastTitle || !newSpotifyUrl || !selectedPodcastGenreId) return;

//     setPodcasts((prev) => [
//       ...prev,
//       {
//         id: uid(),
//         title: newPodcastTitle,
//         spotifyUrl: newSpotifyUrl,
//         genreId: selectedPodcastGenreId
//       }
//     ]);

//     setShowAddPodcast(false);
//     setNewPodcastTitle("");
//     setNewSpotifyUrl("");
//     setSelectedPodcastGenreId("");
//   }

//   function addMaterial() {
//     if (!newMaterialTitle || !newMaterialContent || !selectedMaterialGenreId)
//       return;

//     setMaterials((prev) => [
//       ...prev,
//       {
//         id: uid(),
//         title: newMaterialTitle,
//         content: newMaterialContent,
//         genreId: selectedMaterialGenreId
//       }
//     ]);

//     setShowAddMaterial(false);
//     setNewMaterialTitle("");
//     setNewMaterialContent("");
//     setSelectedMaterialGenreId("");
//   }

//   const podcastCount = (genreId: string) =>
//     podcasts.filter((p) => p.genreId === genreId).length;

//   const materialCount = (genreId: string) =>
//     materials.filter((m) => m.genreId === genreId).length;

//   /* ================= UI ================= */

//   return (
//     <div className="admin">
//       <h2>Admin Dashboard</h2>

//       {/* ================= GENRES ================= */}
//       <section>
//         <div
//           className={`section-header ${genresOpen ? "open" : ""}`}
//           onClick={() => setGenresOpen(!genresOpen)}
//         >
//           <span>▶</span> Genres
//         </div>

//         {genresOpen && (
//           <>
//             <button className="mt-12" onClick={() => setShowAddGenre(true)}>
//               + Add Genre
//             </button>

//             <table>
//               <thead>
//                 <tr>
//                   <th>Name</th>
//                   <th>Podcasts</th>
//                   <th>Materials</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {genres.map((g) => (
//                   <tr key={g.id}>
//                     <td>{g.name}</td>
//                     <td>{podcastCount(g.id)}</td>
//                     <td>{materialCount(g.id)}</td>
//                     <td>Edit</td>
//                   </tr>
//                 ))}

//                 {genres.length === 0 && (
//                   <tr>
//                     <td colSpan={4} className="empty">
//                       No genres created yet
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </>
//         )}
//       </section>

//       {/* ================= PODCASTS ================= */}
//       <section>
//         <div
//           className={`section-header ${podcastsOpen ? "open" : ""}`}
//           onClick={() => setPodcastsOpen(!podcastsOpen)}
//         >
//           <span>▶</span> Podcasts
//         </div>

//         {podcastsOpen && (
//           <>
//             <button className="mt-12" onClick={() => setShowAddPodcast(true)}>
//               + Add Podcast
//             </button>

//             <table>
//               <thead>
//                 <tr>
//                   <th>Title</th>
//                   <th>Genre</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {podcasts.map((p) => (
//                   <tr key={p.id}>
//                     <td>{p.title}</td>
//                     <td>{genres.find((g) => g.id === p.genreId)?.name}</td>
//                     <td>Edit</td>
//                   </tr>
//                 ))}

//                 {podcasts.length === 0 && (
//                   <tr>
//                     <td colSpan={3} className="empty">
//                       No podcasts yet
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </>
//         )}
//       </section>

//       {/* ================= MATERIALS ================= */}
//       <section>
//         <div
//           className={`section-header ${materialsOpen ? "open" : ""}`}
//           onClick={() => setMaterialsOpen(!materialsOpen)}
//         >
//           <span>▶</span> Materials
//         </div>

//         {materialsOpen && (
//           <>
//             <button className="mt-12" onClick={() => setShowAddMaterial(true)}>
//               + Add Material
//             </button>

//             <table>
//               <thead>
//                 <tr>
//                   <th>Title</th>
//                   <th>Genre</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {materials.map((m) => (
//                   <tr key={m.id}>
//                     <td>{m.title}</td>
//                     <td>{genres.find((g) => g.id === m.genreId)?.name}</td>
//                     <td>Edit</td>
//                   </tr>
//                 ))}

//                 {materials.length === 0 && (
//                   <tr>
//                     <td colSpan={3} className="empty">
//                       No materials yet
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </>
//         )}
//       </section>

//       {/* ================= ADD GENRE MODAL ================= */}
//       {showAddGenre && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <button className="modal-close" onClick={closeGenreModal}>
//               ✕
//             </button>

//             <div className="step">Step {step} of 3</div>

//             {step === 1 && (
//               <>
//                 <input
//                   placeholder="Genre name"
//                   value={genreName}
//                   onChange={(e) => setGenreName(e.target.value)}
//                 />
//                 <div className="modal-actions">
//                   <span />
//                   <button disabled={!genreName} onClick={() => setStep(2)}>
//                     Next
//                   </button>
//                 </div>
//               </>
//             )}

//             {step === 2 && (
//               <>
//                 <input
//                   placeholder="Podcast title"
//                   value={podcastTitle}
//                   onChange={(e) => setPodcastTitle(e.target.value)}
//                 />
//                 <input
//                   placeholder="Spotify URL"
//                   value={spotifyUrl}
//                   onChange={(e) => setSpotifyUrl(e.target.value)}
//                 />
//                 <div className="modal-actions">
//                   <button className="secondary" onClick={() => setStep(1)}>
//                     Back
//                   </button>
//                   <button
//                     disabled={!podcastTitle || !spotifyUrl}
//                     onClick={() => setStep(3)}
//                   >
//                     Next
//                   </button>
//                 </div>
//               </>
//             )}

//             {step === 3 && (
//               <>
//                 <input
//                   placeholder="Material title"
//                   value={materialTitle}
//                   onChange={(e) => setMaterialTitle(e.target.value)}
//                 />
//                 <textarea
//                   placeholder="Material content"
//                   value={materialContent}
//                   onChange={(e) => setMaterialContent(e.target.value)}
//                 />
//                 <div className="modal-actions">
//                   <button className="secondary" onClick={() => setStep(2)}>
//                     Back
//                   </button>
//                   <button
//                     disabled={!materialTitle || !materialContent}
//                     onClick={createGenreFlow}
//                   >
//                     Create Genre
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ================= ADD PODCAST MODAL ================= */}
//       {showAddPodcast && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <button
//               className="modal-close"
//               onClick={() => setShowAddPodcast(false)}
//             >
//               ✕
//             </button>

//             <div className="step">Add Podcast</div>

//             <input
//               placeholder="Podcast title"
//               value={newPodcastTitle}
//               onChange={(e) => setNewPodcastTitle(e.target.value)}
//             />
//             <input
//               placeholder="Spotify URL"
//               value={newSpotifyUrl}
//               onChange={(e) => setNewSpotifyUrl(e.target.value)}
//             />

//             <select
//               value={selectedPodcastGenreId}
//               onChange={(e) => setSelectedPodcastGenreId(e.target.value)}
//             >
//               <option value="">Select genre</option>
//               {genres.map((g) => (
//                 <option key={g.id} value={g.id}>
//                   {g.name}
//                 </option>
//               ))}
//             </select>

//             <div className="modal-actions">
//               <button
//                 className="secondary"
//                 onClick={() => setShowAddPodcast(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 disabled={
//                   !newPodcastTitle ||
//                   !newSpotifyUrl ||
//                   !selectedPodcastGenreId
//                 }
//                 onClick={addPodcast}
//               >
//                 Add Podcast
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ================= ADD MATERIAL MODAL ================= */}
//       {showAddMaterial && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <button
//               className="modal-close"
//               onClick={() => setShowAddMaterial(false)}
//             >
//               ✕
//             </button>

//             <div className="step">Add Material</div>

//             <input
//               placeholder="Material title"
//               value={newMaterialTitle}
//               onChange={(e) => setNewMaterialTitle(e.target.value)}
//             />

//             <textarea
//               placeholder="Material content"
//               value={newMaterialContent}
//               onChange={(e) => setNewMaterialContent(e.target.value)}
//             />

//             <select
//               value={selectedMaterialGenreId}
//               onChange={(e) => setSelectedMaterialGenreId(e.target.value)}
//             >
//               <option value="">Select genre</option>
//               {genres.map((g) => (
//                 <option key={g.id} value={g.id}>
//                   {g.name}
//                 </option>
//               ))}
//             </select>

//             <div className="modal-actions">
//               <button
//                 className="secondary"
//                 onClick={() => setShowAddMaterial(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 disabled={
//                   !newMaterialTitle ||
//                   !newMaterialContent ||
//                   !selectedMaterialGenreId
//                 }
//                 onClick={addMaterial}
//               >
//                 Add Material
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from "react";
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

  function createGenre() {
    const genreId = uid();

    setGenres((g) => [...g, { id: genreId, name: genreName }]);
    setPodcasts((p) => [
      ...p,
      {
        id: uid(),
        title: podcastTitle,
        author: podcastAuthor,
        spotifyUrl,
        genreId
      }
    ]);
    setMaterials((m) => [
      ...m,
      {
        id: uid(),
        title: materialTitle,
        author: materialAuthor,
        content: materialContent,
        genreId
      }
    ]);

    closeGenreModal();
  }

  function addPodcast() {
    if (!newPodcastTitle || !newPodcastAuthor || !newSpotifyUrl || !podcastGenreId) return;

    setPodcasts((p) => [
      ...p,
      {
        id: uid(),
        title: newPodcastTitle,
        author: newPodcastAuthor,
        spotifyUrl: newSpotifyUrl,
        genreId: podcastGenreId
      }
    ]);

    setShowAddPodcast(false);
    setNewPodcastTitle("");
    setNewPodcastAuthor("");
    setNewSpotifyUrl("");
    setPodcastGenreId("");
  }

  function addMaterial() {
    if (!newMaterialTitle || !newMaterialAuthor || !newMaterialContent || !materialGenreId) return;

    setMaterials((m) => [
      ...m,
      {
        id: uid(),
        title: newMaterialTitle,
        author: newMaterialAuthor,
        content: newMaterialContent,
        genreId: materialGenreId
      }
    ]);

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
