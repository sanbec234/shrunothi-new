// import { useState } from "react";
// import "./AdminDashboard.css";

// /* ---------- Types ---------- */

// type Genre = {
//   id: string;
//   name: string;
//   isDirty?: boolean;
// };

// type Podcast = {
//   id: string;
//   title: string;
//   author: string;
//   spotifyUrl: string;
//   genreIds: string[];
// };

// type Material = {
//   id: string;
//   title: string;
//   author: string;
//   content: string;
//   genreIds: string[];
// };

// type SelfHelp = {
//   id: string;
//   title: string;
//   author: string;
//   content: string;
//   isDirty?: boolean;
// };

// /* ---------- Helpers ---------- */

// const uid = () => crypto.randomUUID();

// /* ---------- Component ---------- */

// export default function AdminDashboard() {
//   const [genres, setGenres] = useState<Genre[]>([]);
//   const [podcasts, setPodcasts] = useState<Podcast[]>([]);
//   const [materials, setMaterials] = useState<Material[]>([]);
//   const [selfHelps, setSelfHelps] = useState<SelfHelp[]>([]);

//   /* ---------- Derived ---------- */

//   const genreStats = (genreId: string) => ({
//     podcastCount: podcasts.filter(p => p.genreIds.includes(genreId)).length,
//     materialCount: materials.filter(m => m.genreIds.includes(genreId)).length
//   });

//   const isGenreActive = (genreId: string) => {
//     const { podcastCount, materialCount } = genreStats(genreId);
//     return podcastCount >= 1 && materialCount >= 1;
//   };

//   const activeGenres = genres.filter(g => isGenreActive(g.id));

//   /* ---------- Actions ---------- */

//   function confirmDelete(message: string) {
//     return window.confirm(message);
//   }

//   function deleteGenre(id: string) {
//     if (!confirmDelete("Delete this genre?")) return;
//     setGenres(prev => prev.filter(g => g.id !== id));
//   }

//   function deletePodcast(id: string) {
//     if (!confirmDelete("Delete this podcast?")) return;
//     setPodcasts(prev => prev.filter(p => p.id !== id));
//   }

//   function deleteMaterial(id: string) {
//     if (!confirmDelete("Delete this material?")) return;
//     setMaterials(prev => prev.filter(m => m.id !== id));
//   }

//   function deleteSelfHelp(id: string) {
//     if (!confirmDelete("Delete this self-help guide?")) return;
//     setSelfHelps(prev => prev.filter(s => s.id !== id));
//   }

//   return (
//     <div className="admin-root">
//       <h1>Admin Dashboard</h1>

//       {/* ================= GENRES ================= */}

//       <section className="admin-section">
//         <h2>Genres</h2>

//         <button
//           className="admin-btn"
//           onClick={() =>
//             setGenres([...genres, { id: uid(), name: "New Genre" }])
//           }
//         >
//           + Add Genre
//         </button>

//         <table className="admin-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Status</th>
//               <th>Podcasts</th>
//               <th>Materials</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {genres.map(g => {
//               const { podcastCount, materialCount } = genreStats(g.id);
//               const active = isGenreActive(g.id);

//               return (
//                 <tr key={g.id}>
//                   <td>
//                     <input
//                       className="admin-input"
//                       value={g.name}
//                       onChange={e =>
//                         setGenres(genres.map(x =>
//                           x.id === g.id ? { ...x, name: e.target.value } : x
//                         ))
//                       }
//                     />
//                   </td>
//                   <td className={active ? "genre-active" : "genre-incomplete"}>
//                     {active ? "Active" : "Incomplete"}
//                   </td>
//                   <td>{podcastCount}</td>
//                   <td>{materialCount}</td>
//                   <td>
//                     <button
//                       className="admin-btn danger"
//                       onClick={() => deleteGenre(g.id)}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </section>

//       {/* ================= PODCASTS ================= */}

//       <section className="admin-section">
//         <h2>Podcasts</h2>

//         <button
//           className="admin-btn"
//           disabled={activeGenres.length === 0}
//           onClick={() =>
//             setPodcasts([...podcasts, {
//               id: uid(),
//               title: "New Podcast",
//               author: "",
//               spotifyUrl: "",
//               genreIds: activeGenres.slice(0, 1).map(g => g.id)
//             }])
//           }
//         >
//           + Add Podcast
//         </button>

//         <table className="admin-table">
//           <thead>
//             <tr>
//               <th>Title</th>
//               <th>Author</th>
//               <th>Genres</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {podcasts.map(p => (
//               <tr key={p.id}>
//                 <td>
//                   <input
//                     className="admin-input"
//                     value={p.title}
//                     onChange={e =>
//                       setPodcasts(podcasts.map(x =>
//                         x.id === p.id ? { ...x, title: e.target.value } : x
//                       ))
//                     }
//                   />
//                 </td>
//                 <td>
//                   <input
//                     className="admin-input"
//                     value={p.author}
//                     onChange={e =>
//                       setPodcasts(podcasts.map(x =>
//                         x.id === p.id ? { ...x, author: e.target.value } : x
//                       ))
//                     }
//                   />
//                 </td>
//                 <td>
//                   <div className="checkbox-group">
//                     {activeGenres.map(g => (
//                       <label key={g.id}>
//                         <input
//                           type="checkbox"
//                           checked={p.genreIds.includes(g.id)}
//                           onChange={() =>
//                             setPodcasts(podcasts.map(x =>
//                               x.id !== p.id ? x :
//                               x.genreIds.includes(g.id)
//                                 ? { ...x, genreIds: x.genreIds.filter(id => id !== g.id) }
//                                 : { ...x, genreIds: [...x.genreIds, g.id] }
//                             ))
//                           }
//                         />
//                         {g.name}
//                       </label>
//                     ))}
//                   </div>
//                 </td>
//                 <td>
//                   <button
//                     className="admin-btn danger"
//                     onClick={() => deletePodcast(p.id)}
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </section>

//       {/* ================= MATERIALS ================= */}

//       <section className="admin-section">
//         <h2>Materials</h2>

//         <button
//           className="admin-btn"
//           disabled={activeGenres.length === 0}
//           onClick={() =>
//             setMaterials([...materials, {
//               id: uid(),
//               title: "New Material",
//               author: "",
//               content: "",
//               genreIds: activeGenres.slice(0, 1).map(g => g.id)
//             }])
//           }
//         >
//           + Add Material
//         </button>

//         <table className="admin-table">
//           <thead>
//             <tr>
//               <th>Title</th>
//               <th>Author</th>
//               <th>Genres</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {materials.map(m => (
//               <tr key={m.id}>
//                 <td>
//                   <input
//                     className="admin-input"
//                     value={m.title}
//                     onChange={e =>
//                       setMaterials(materials.map(x =>
//                         x.id === m.id ? { ...x, title: e.target.value } : x
//                       ))
//                     }
//                   />
//                 </td>
//                 <td>
//                   <input
//                     className="admin-input"
//                     value={m.author}
//                     onChange={e =>
//                       setMaterials(materials.map(x =>
//                         x.id === m.id ? { ...x, author: e.target.value } : x
//                       ))
//                     }
//                   />
//                 </td>
//                 <td>
//                   <div className="checkbox-group">
//                     {activeGenres.map(g => (
//                       <label key={g.id}>
//                         <input
//                           type="checkbox"
//                           checked={m.genreIds.includes(g.id)}
//                           onChange={() =>
//                             setMaterials(materials.map(x =>
//                               x.id !== m.id ? x :
//                               x.genreIds.includes(g.id)
//                                 ? { ...x, genreIds: x.genreIds.filter(id => id !== g.id) }
//                                 : { ...x, genreIds: [...x.genreIds, g.id] }
//                             ))
//                           }
//                         />
//                         {g.name}
//                       </label>
//                     ))}
//                   </div>
//                 </td>
//                 <td>
//                   <button
//                     className="admin-btn danger"
//                     onClick={() => deleteMaterial(m.id)}
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </section>

//       {/* ================= SELF HELP ================= */}

//       <section className="admin-section">
//         <h2>Self-Help Guides</h2>

//         <button
//           className="admin-btn"
//           onClick={() =>
//             setSelfHelps([...selfHelps, {
//               id: uid(),
//               title: "New Guide",
//               author: "",
//               content: ""
//             }])
//           }
//         >
//           + Add Self-Help Guide
//         </button>

//         <table className="admin-table">
//           <thead>
//             <tr>
//               <th>Title</th>
//               <th>Author</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {selfHelps.map(s => (
//               <tr key={s.id}>
//                 <td>
//                   <input
//                     className="admin-input"
//                     value={s.title}
//                     onChange={e =>
//                       setSelfHelps(selfHelps.map(x =>
//                         x.id === s.id ? { ...x, title: e.target.value } : x
//                       ))
//                     }
//                   />
//                 </td>
//                 <td>
//                   <input
//                     className="admin-input"
//                     value={s.author}
//                     onChange={e =>
//                       setSelfHelps(selfHelps.map(x =>
//                         x.id === s.id ? { ...x, author: e.target.value } : x
//                       ))
//                     }
//                   />
//                 </td>
//                 <td>
//                   <button
//                     className="admin-btn danger"
//                     onClick={() => deleteSelfHelp(s.id)}
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </section>
//     </div>
//   );
// }

import { useState } from "react";
import "./AdminDashboard.css";

/* ---------- Types ---------- */

type Genre = {
  id: string;
  name: string;
  isDirty?: boolean;
};

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
  isDirty?: boolean;
};

/* ---------- Helpers ---------- */

const uid = () => crypto.randomUUID();

/* ---------- Component ---------- */

export default function AdminDashboard() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selfHelps, setSelfHelps] = useState<SelfHelp[]>([]);

  /* ---------- Collapsible state ---------- */

  const [showGenres, setShowGenres] = useState(false);
  const [showPodcasts, setShowPodcasts] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showSelfHelp, setShowSelfHelp] = useState(false);

  /* ---------- Wizard state ---------- */

  const [showGenreWizard, setShowGenreWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardGenreId, setWizardGenreId] = useState<string | null>(null);

  const [genreName, setGenreName] = useState("");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");

  /* ---------- Derived ---------- */

  const genreStats = (genreId: string) => ({
    podcastCount: podcasts.filter(p => p.genreId === genreId).length,
    materialCount: materials.filter(m => m.genreId === genreId).length
  });

  const isGenreActive = (genreId: string) => {
    const { podcastCount, materialCount } = genreStats(genreId);
    return podcastCount >= 1 && materialCount >= 1;
  };

  /* ---------- Actions ---------- */

  function confirmDelete(message: string) {
    return window.confirm(message);
  }

  function deleteGenre(id: string) {
    if (!confirmDelete("Delete this genre?")) return;
    setGenres(prev => prev.filter(g => g.id !== id));
  }

  function deleteSelfHelp(id: string) {
    if (!confirmDelete("Delete this self-help guide?")) return;
    setSelfHelps(prev => prev.filter(s => s.id !== id));
  }

  function quitWizard() {
    if (!window.confirm("Quit setup? You can complete this later.")) return;
    setShowGenreWizard(false);
    setWizardStep(1);
    setWizardGenreId(null);
    setGenreName("");
    setPodcastTitle("");
    setMaterialTitle("");
  }

  /* ---------- Wizard submit ---------- */

  function handleWizardNext() {
    if (wizardStep === 1) {
      const id = uid();
      setGenres([...genres, { id, name: genreName }]);
      setWizardGenreId(id);
      setWizardStep(2);
    } else if (wizardStep === 2) {
      setPodcasts([
        ...podcasts,
        {
          id: uid(),
          title: podcastTitle,
          author: "",
          spotifyUrl: "",
          genreId: wizardGenreId!
        }
      ]);
      setWizardStep(3);
    } else {
      setMaterials([
        ...materials,
        {
          id: uid(),
          title: materialTitle,
          author: "",
          content: "",
          genreId: wizardGenreId!
        }
      ]);
      setShowGenreWizard(false);
      setWizardStep(1);
      setWizardGenreId(null);
    }
  }

  return (
    <div className="admin-root">
      <h1>Admin Dashboard</h1>

      {/* ================= GENRES ================= */}

      <section className="admin-section">
        <div
          className="section-header"
          onClick={() => setShowGenres(v => !v)}
        >
          <span>{showGenres ? "▼" : "▶"} Genres</span>
        </div>

        <button
          className="admin-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowGenreWizard(true);
          }}
        >
          + Add Genre
        </button>

        {showGenres && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Podcasts</th>
                <th>Materials</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {genres.map(g => {
                const { podcastCount, materialCount } = genreStats(g.id);
                const active = isGenreActive(g.id);

                return (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td className={active ? "genre-active" : "genre-incomplete"}>
                      {active ? "Active" : "Incomplete"}
                    </td>
                    <td>{podcastCount}</td>
                    <td>{materialCount}</td>
                    <td>
                      <button
                        className="admin-btn danger"
                        onClick={() => deleteGenre(g.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* ================= PODCASTS ================= */}

      <section className="admin-section">
        <h2 onClick={() => setShowPodcasts(v => !v)}>
          {showPodcasts ? "▼" : "▶"} Podcasts
        </h2>

        {showPodcasts && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Genre</th>
              </tr>
            </thead>
            <tbody>
              {podcasts.map(p => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{genres.find(g => g.id === p.genreId)?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================= MATERIALS ================= */}

      <section className="admin-section">
        <h2 onClick={() => setShowMaterials(v => !v)}>
          {showMaterials ? "▼" : "▶"} Materials
        </h2>

        {showMaterials && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Genre</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{genres.find(g => g.id === m.genreId)?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================= SELF HELP ================= */}

      <section className="admin-section">
        <h2 onClick={() => setShowSelfHelp(v => !v)}>
          {showSelfHelp ? "▼" : "▶"} Self-Help Guides
        </h2>

        {showSelfHelp && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
              </tr>
            </thead>
            <tbody>
              {selfHelps.map(s => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================= POPUP ================= */}

      {showGenreWizard && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <h3>
              {wizardStep === 1
                ? "Add Genre"
                : wizardStep === 2
                ? "Add First Podcast"
                : "Add First Material"}
            </h3>

            {wizardStep === 1 && (
              <input
                className="admin-input"
                placeholder="Genre name"
                value={genreName}
                onChange={e => setGenreName(e.target.value)}
              />
            )}

            {wizardStep === 2 && (
              <input
                className="admin-input"
                placeholder="Podcast title"
                value={podcastTitle}
                onChange={e => setPodcastTitle(e.target.value)}
              />
            )}

            {wizardStep === 3 && (
              <input
                className="admin-input"
                placeholder="Material title"
                value={materialTitle}
                onChange={e => setMaterialTitle(e.target.value)}
              />
            )}

            <div style={{ marginTop: 16 }}>
              <button className="admin-btn danger" onClick={quitWizard}>
                Quit
              </button>

              <button
                className="admin-btn"
                style={{ marginLeft: 8 }}
                onClick={handleWizardNext}
              >
                {wizardStep === 3 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}