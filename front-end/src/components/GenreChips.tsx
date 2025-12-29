// src/components/GenreChips.tsx
import type { Genre } from '../types/index';

type Props = {
  genres: Genre[];
  selected: Genre | null;
  onSelect: (g: Genre) => void;
};

export default function GenreChips({ genres, selected, onSelect }: Props) {
  return (
    <div className="genre-chips">
      {genres.map((g) => (
        <button
          key={g.id}
          className={`chip ${selected?.id === g.id ? 'active' : ''}`}
          onClick={() => onSelect(g)}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}