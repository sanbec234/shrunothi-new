import { useEffect } from "react";
import type { VimeoVideo } from "../VimeoCard/VimeoCard";
import "./VimeoPlayerModal.css";

interface VimeoPlayerModalProps {
  video: VimeoVideo;
  onClose: () => void;
}

export default function VimeoPlayerModal({ video, onClose }: VimeoPlayerModalProps) {
  const embedUrl = `https://player.vimeo.com/video/${video.vimeo_id}?autoplay=1&badge=0&autopause=0&player_id=0&app_id=58479`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="vpm-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={video.title}>
      <div className="vpm-container" onClick={(e) => e.stopPropagation()}>
        <button className="vpm-close" onClick={onClose} aria-label="Close player">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="vpm-frame-wrap">
          <iframe
            src={embedUrl}
            className="vpm-iframe"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            title={video.title}
            allowFullScreen
          />
        </div>
        <div className="vpm-title">{video.title}</div>
      </div>
    </div>
  );
}
