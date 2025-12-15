import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Podcast, Genre } from '../types';

export default function RightSidebar({ selectedGenre }: { selectedGenre: Genre | null }): JSX.Element {
  const [podcasts, setPodcasts] = useState<Podcast[] | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!selectedGenre) {
      setPodcasts(null);
      return;
    }
    async function load() {
      try {
        const res = await api.get<{ podcasts: Podcast[] }>(`/genres/${selectedGenre.id}/podcasts`);
        if (!mounted) return;
        setPodcasts(res.data.podcasts || []);
      } catch (err) {
        console.error('Failed to load podcasts', err);
        setPodcasts([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedGenre]);

  return (
    <aside className="right-sidebar">
      {!selectedGenre ? (
        <div className="placeholder">Click on a genre to view relevant podcasts</div>
      ) : podcasts === null ? (
        <div className="placeholder">Loading podcasts…</div>
      ) : podcasts.length === 0 ? (
        <div className="placeholder">No podcasts found for this genre.</div>
      ) : (
        <div className="podcast-list">
          {podcasts.map((p, i) => (
            <div key={i} className="podcast-item">
              {p.title && <div className="podcast-title">{p.title}</div>}
              <div className="podcast-embed">
                <iframe
                  src={p.embed_url}
                  title={p.title || `podcast-${i}`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
