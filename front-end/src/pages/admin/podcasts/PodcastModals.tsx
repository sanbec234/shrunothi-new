import { useState, useEffect } from "react";
import type { Genre, Podcast } from "../admin.types";
import {
  DEFAULT_PODCAST_LANGUAGE,
  INDIAN_PODCAST_LANGUAGES,
} from "../../../constants/podcastLanguages";
import "./podcasts.css";

interface AddPodcastModalProps {
  isOpen: boolean;
  genres: Genre[];
  onClose: () => void;
  onCreate: (data: {
    title: string;
    spotifyUrl: string;
    genreId: string;
    language: string;
  }) => Promise<void>;
}

export function AddPodcastModal({ isOpen, genres, onClose, onCreate }: AddPodcastModalProps) {
  const [title, setTitle] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [genreId, setGenreId] = useState("");
  const [language, setLanguage] = useState(DEFAULT_PODCAST_LANGUAGE);

  const reset = () => {
    setTitle("");
    setSpotifyUrl("");
    setGenreId("");
    setLanguage(DEFAULT_PODCAST_LANGUAGE);
  };

  const handleCreate = async () => {
    if (!title || !spotifyUrl || !genreId || !language) {
      alert("All fields required");
      return;
    }

    await onCreate({ title, spotifyUrl, genreId, language });
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal podcast-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="Spotify URL"
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
        />
        <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
          <option value="">Select genre</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {INDIAN_PODCAST_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button onClick={handleCreate}>Add Podcast</button>
      </div>
    </div>
  );
}

interface EditPodcastModalProps {
  podcast: Podcast | null;
  genres: Genre[];
  onClose: () => void;
  onSave: (
    id: string,
    data: { title: string; spotifyUrl: string; genreId: string; language: string }
  ) => Promise<void>;
}

export function EditPodcastModal({ podcast, genres, onClose, onSave }: EditPodcastModalProps) {
  const [title, setTitle] = useState(podcast?.title || "");
  const [spotifyUrl, setSpotifyUrl] = useState(podcast?.spotifyUrl || "");
  const [genreId, setGenreId] = useState(podcast?.genreId || "");
  const [language, setLanguage] = useState(
    podcast?.language || DEFAULT_PODCAST_LANGUAGE
  );
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
        if (!podcast) return;

        setTitle(podcast.title);
        setSpotifyUrl(podcast.spotifyUrl);
        setGenreId(podcast.genreId);
        setLanguage(podcast.language || DEFAULT_PODCAST_LANGUAGE);
      }, [podcast]);

  if (!podcast) return null;
      
  const handleSave = async () => {
    await onSave(podcast.id, { title, spotifyUrl, genreId, language });
    setSuccessMessage("Podcast updated successfully");

    setTimeout(() => {
      onClose();
      setSuccessMessage("");
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal podcast-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {successMessage && <div className="success-banner">{successMessage}</div>}

        <h3>Edit Podcast</h3>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />

        <input
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          placeholder="Spotify URL"
        />

        <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
          <option value="">Select genre</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {INDIAN_PODCAST_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}
