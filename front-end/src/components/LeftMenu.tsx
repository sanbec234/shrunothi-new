import { type JSX } from 'react';
import type { Genre } from '../types';

export default function LeftMenu({
  genres,
  onSelect,
  selected
}: {
  genres: Genre[];
  onSelect: (g: Genre) => void;
  selected: Genre | null;
}): JSX.Element {
  return (
    <aside className="left-menu">
      <div className="logo"> 
        {/* Replace with <img src="/path/to/logo.png" alt="logo" /> if you have it */}
        <div className="logo">
          <img
            src="/logo.png"
            alt="Shrunothi"
            className="logo-img"
          />
        </div>
      </div>

      <div className="genre-list">
        {genres.map((g) => (
          <button
            key={g.id}
            className={`genre-btn ${selected?.id === g.id ? 'selected' : ''}`}
            onClick={() => onSelect(g)}
          >
            {g.name}
          </button>
        ))}
      </div>
    </aside>
  );
}
