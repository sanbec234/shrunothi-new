import { useState } from "react";
import "./admin.base.css";


// Hooks
import { useIdleLogout, useModalBodyLock, useEscapeKey } from "./admin.hooks";
import { useGenres } from "./genres/useGenres";
import { usePodcasts } from "./podcasts/usePodcasts";
import { useMaterials } from "./materials/useMaterials";
import { useSelfHelp } from "./selfHelp/useSelfHelp";
import { useAdminEmails } from "./adminEmails/useAdminEmails";
import { useUsers } from "./users/useUsers";

// Sections
import GenresSection from "./genres/GenresSection";
import PodcastsSection from "./podcasts/PodcastsSection";
import MaterialsSection from "./materials/MaterialsSection";
import SelfHelpSection from "./selfHelp/SelfHelpSection";
import AdminEmailsSection from "./adminEmails/AdminEmailsSection";
import UsersSection from "./users/UsersSection";
import AdminAnnouncements from "./announcements/AdminAnnouncements";

// Modals
import { AddGenreModal, EditGenreModal } from "./genres/GenreModals";
import { AddPodcastModal, EditPodcastModal } from "./podcasts/PodcastModals";
import { AddMaterialModal, EditMaterialModal } from "./materials/MaterialModals";
import { AddSelfHelpModal, EditSelfHelpModal } from "./selfHelp/SelfHelpModals";

// Types
import type { Genre, Podcast, Material, SelfHelp } from "./admin.types";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("authUser") || "null");

  // Custom hooks
  useIdleLogout();

  const genresHook = useGenres();
  const podcastsHook = usePodcasts();
  const materialsHook = useMaterials();
  const selfHelpHook = useSelfHelp();
  const adminEmailsHook = useAdminEmails();
  const usersHook = useUsers();

  // Section toggles
  const [genresOpen, setGenresOpen] = useState(true);
  const [podcastsOpen, setPodcastsOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [selfHelpOpen, setSelfHelpOpen] = useState(false);

  // Filters
  const [podcastGenreFilter, setPodcastGenreFilter] = useState<string>("all");
  const [materialGenreFilter, setMaterialGenreFilter] = useState<string>("all");

  // Genre modals
  const [showAddGenre, setShowAddGenre] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);

  // Podcast modals
  const [showAddPodcast, setShowAddPodcast] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);

  // Material modals
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Self-help modals
  const [showAddSelfHelp, setShowAddSelfHelp] = useState(false);
  const [editingSelfHelp, setEditingSelfHelp] = useState<SelfHelp | null>(null);

  // Check if any modal is open
  const isAnyModalOpen =
    showAddGenre ||
    showAddPodcast ||
    showAddMaterial ||
    showAddSelfHelp ||
    !!editingGenre ||
    !!editingPodcast ||
    !!editingMaterial ||
    !!editingSelfHelp;

  // Lock body scroll when modal is open
  useModalBodyLock(isAnyModalOpen);

  // Close all modals on Escape
  useEscapeKey(isAnyModalOpen, () => {
    setShowAddGenre(false);
    setShowAddPodcast(false);
    setShowAddMaterial(false);
    setShowAddSelfHelp(false);
    setEditingGenre(null);
    setEditingPodcast(null);
    setEditingMaterial(null);
    setEditingSelfHelp(null);
  });

  // Genre handlers
  const handleCreateGenre = async (data: {
    genreName: string;
    podcast?: { title: string; spotifyUrl: string };
    material?: { title: string; author: string; content: string };
  }) => {
    const genreId = await genresHook.createGenre(data.genreName);

    if (data.podcast) {
      await podcastsHook.createPodcast({ ...data.podcast, genreId });
    }

    if (data.material) {
      await materialsHook.createMaterial({ ...data.material, genreId });
    }

    setShowAddGenre(false);
  };

  const handleDeleteGenre = async (id: string) => {
    if (!confirm("Delete this genre?")) return;

    try {
      await genresHook.deleteGenre(id);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete genre");
    }
  };

  // Podcast handlers
  const handleDeletePodcast = async (id: string) => {
    if (!confirm("Delete this podcast?")) return;
    await podcastsHook.deletePodcast(id);
  };

  // Material handlers
  const handleEditMaterial = async (material: Material) => {
    setEditingMaterial(material);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    await materialsHook.deleteMaterial(id);
  };

  // Self-help handlers
  const handleEditSelfHelp = async (selfHelp: SelfHelp) => {
    setEditingSelfHelp(selfHelp);
  };

  const handleDeleteSelfHelp = async (id: string) => {
    if (!confirm("Delete this self-help guide?")) return;
    await selfHelpHook.deleteSelfHelp(id);
  };

  return (
    <div className="admin">
      <img src="./logo.png" alt="shrunothi logo" className="admin-dash-logo" />
      <h2>Admin Dashboard</h2>
      <div className="admin-user-logout">
        <div className="admin-welcome">Welcome{user?.name ? `, ${user.name}` : ""}</div>

        <button
          className="admin-logout"
          onClick={() => {
            localStorage.removeItem("authUser");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>

      {/* Genres Section */}
      <GenresSection
        genres={genresHook.genres}
        podcasts={podcastsHook.podcasts}
        materials={materialsHook.materials}
        isOpen={genresOpen}
        onToggle={() => setGenresOpen(!genresOpen)}
        onAddClick={() => setShowAddGenre(true)}
        onEditClick={(g) => setEditingGenre(g)}
        onDeleteClick={handleDeleteGenre}
      />

      {/* Podcasts Section */}
      <PodcastsSection
        podcasts={podcastsHook.podcasts}
        genres={genresHook.genres}
        isOpen={podcastsOpen}
        genreFilter={podcastGenreFilter}
        onToggle={() => setPodcastsOpen(!podcastsOpen)}
        onFilterChange={setPodcastGenreFilter}
        onAddClick={() => setShowAddPodcast(true)}
        onEditClick={(p) => setEditingPodcast(p)}
        onDeleteClick={handleDeletePodcast}
      />

      {/* Materials Section */}
      <MaterialsSection
        materials={materialsHook.materials}
        genres={genresHook.genres}
        isOpen={materialsOpen}
        genreFilter={materialGenreFilter}
        onToggle={() => setMaterialsOpen(!materialsOpen)}
        onFilterChange={setMaterialGenreFilter}
        onAddClick={() => setShowAddMaterial(true)}
        onEditClick={handleEditMaterial}
        onDeleteClick={handleDeleteMaterial}
      />

      {/* Self-Help Section */}
      <SelfHelpSection
        selfHelps={selfHelpHook.selfHelps}
        isOpen={selfHelpOpen}
        onToggle={() => setSelfHelpOpen(!selfHelpOpen)}
        onAddClick={() => setShowAddSelfHelp(true)}
        onEditClick={handleEditSelfHelp}
        onDeleteClick={handleDeleteSelfHelp}
      />

      {/* Admin Emails Section */}
      <AdminEmailsSection
        adminEmails={adminEmailsHook.adminEmails}
        currentUserEmail={user?.email}
        onAdd={adminEmailsHook.createAdminEmail}
        onDelete={adminEmailsHook.deleteAdminEmail}
      />

      {/* Announcements Section */}
      <section>
        <AdminAnnouncements />
      </section>

      {/* Users Section */}
      <UsersSection users={usersHook.users} />

      {/* Genre Modals */}
      <AddGenreModal
        isOpen={showAddGenre}
        genres={genresHook.genres}
        onClose={() => setShowAddGenre(false)}
        onCreate={handleCreateGenre}
      />
      <EditGenreModal
        genre={editingGenre}
        onClose={() => setEditingGenre(null)}
        onSave={genresHook.updateGenre}
      />

      {/* Podcast Modals */}
      <AddPodcastModal
        isOpen={showAddPodcast}
        genres={genresHook.genres}
        onClose={() => setShowAddPodcast(false)}
        onCreate={podcastsHook.createPodcast}
      />
      <EditPodcastModal
        podcast={editingPodcast}
        genres={genresHook.genres}
        onClose={() => setEditingPodcast(null)}
        onSave={podcastsHook.updatePodcast}
      />

      {/* Material Modals */}
      <AddMaterialModal
        isOpen={showAddMaterial}
        genres={genresHook.genres}
        onClose={() => setShowAddMaterial(false)}
        onCreate={materialsHook.createMaterial}
      />
      <EditMaterialModal
        material={editingMaterial}
        genres={genresHook.genres}
        onClose={() => setEditingMaterial(null)}
        onSave={materialsHook.updateMaterial}
        fetchContent={materialsHook.fetchMaterialContent}
      />

      {/* Self-Help Modals */}
      <AddSelfHelpModal
        isOpen={showAddSelfHelp}
        onClose={() => setShowAddSelfHelp(false)}
        onCreate={selfHelpHook.createSelfHelp}
      />
      <EditSelfHelpModal
        selfHelp={editingSelfHelp}
        onClose={() => setEditingSelfHelp(null)}
        onSave={selfHelpHook.updateSelfHelp}
        fetchContent={selfHelpHook.fetchSelfHelpContent}
      />
    </div>
  );
}