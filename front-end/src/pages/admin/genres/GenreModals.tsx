import { useState, useEffect } from "react";
import RichEditor from "../../../components/RichEditor";
import type { Genre } from "../admin.types";

interface AddGenreModalProps {
  isOpen: boolean;
  genres: { id: string; name: string }[];
  onClose: () => void;
  onCreate: (data: {
    genreName: string;
    podcast?: { title: string; spotifyUrl: string };
    material?: { title: string; author: string; content: string };
  }) => Promise<void>;
}

export function AddGenreModal({ isOpen, onClose, onCreate }: AddGenreModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [genreName, setGenreName] = useState("");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialAuthor, setMaterialAuthor] = useState("");
  const [materialContent, setMaterialContent] = useState("");

  const reset = () => {
    setStep(1);
    setGenreName("");
    setPodcastTitle("");
    setSpotifyUrl("");
    setMaterialTitle("");
    setMaterialAuthor("");
    setMaterialContent("");
  };

  const handleCreate = async () => {
    await onCreate({
      genreName,
      podcast: podcastTitle && spotifyUrl ? { title: podcastTitle, spotifyUrl } : undefined,
      material:
        materialTitle && materialAuthor && materialContent
          ? { title: materialTitle, author: materialAuthor, content: materialContent }
          : undefined,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal podcast-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          ✕
        </button>

        <div className="step">Step {step} of 3</div>

        {step === 1 && (
          <>
            <input
              placeholder="Genre name"
              value={genreName}
              onChange={(e) => setGenreName(e.target.value)}
            />
            <button disabled={!genreName} onClick={() => setStep(2)}>
              Next
            </button>
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
            <RichEditor value={materialContent} onChange={setMaterialContent} />
            <button onClick={handleCreate}>Create Genre</button>
          </>
        )}
      </div>
    </div>
  );
}

interface EditGenreModalProps {
  genre: Genre | null;
  onClose: () => void;
  onSave: (id: string, name: string) => Promise<void>;
}

export function EditGenreModal({ genre, onClose, onSave }: EditGenreModalProps) {
  const [editName, setEditName] = useState(genre?.name || "");

  useEffect(() => {
    if (!genre) return;
    setEditName(genre.name);
  }, [genre]);

  if (!genre) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <h3>Edit Genre</h3>

        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Genre name"
        />

        <button
          disabled={!editName.trim()}
          onClick={async () => {
            await onSave(genre.id, editName);
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}