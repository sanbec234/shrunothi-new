import { useNavigate } from "react-router-dom";
import "./VimeoCard.css";

export type VimeoVideo = {
  id: string;
  title: string;
  vimeo_id: string;
  thumbnail_url?: string | null;
  locked?: boolean;
};

interface VimeoCardProps {
  video: VimeoVideo;
  onExpand: (video: VimeoVideo) => void;
}

export default function VimeoCard({ video, onExpand }: VimeoCardProps) {
  const navigate = useNavigate();
  const embedUrl = `https://player.vimeo.com/video/${video.vimeo_id}?badge=0&autopause=0&player_id=0&app_id=58479`;

  if (video.locked) {
    return (
      <div className="vimeo-card vimeo-card--locked">
        <div className="vimeo-card__frame-wrap">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="vimeo-card__thumb" />
          ) : (
            <div className="vimeo-card__thumb-placeholder" />
          )}
          <div className="vimeo-card__lock-overlay">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="vimeo-card__body">
          <div className="vimeo-card__title">{video.title}</div>
          <button
            className="vimeo-card__btn"
            onClick={() => navigate("/plans")}
          >
            Subscribe to unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vimeo-card">
      <div className="vimeo-card__frame-wrap">
        <iframe
          src={embedUrl}
          className="vimeo-card__iframe"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          title={video.title}
        />
        <button
          className="vimeo-card__expand-btn"
          onClick={() => onExpand(video)}
          title="Open full player"
          aria-label="Open full player"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="vimeo-card__body">
        <div className="vimeo-card__title">{video.title}</div>
        <button className="vimeo-card__btn" onClick={() => onExpand(video)}>
          Watch Now
        </button>
      </div>
    </div>
  );
}
