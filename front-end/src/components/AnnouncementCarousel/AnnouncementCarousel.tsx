import { useState } from "react";
import "./announcementCarousel.css";

type Announcement = {
  id: string;
  title: string;
  imageUrl: string;
};

type Props = {
  announcements: Announcement[];
  onClose: () => void;
};

export default function AnnouncementCarousel({ announcements, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (announcements.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="carousel-backdrop" onClick={handleSkip}>
      <div
        className="carousel-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button className="carousel-close" onClick={handleSkip}>
          ✕
        </button>

        {/* Image */}
        <div className="carousel-image-container">
          <img
            src={currentAnnouncement.imageUrl}
            alt={currentAnnouncement.title || "Announcement"}
            className="carousel-image"
          />
        </div>

        {/* Navigation */}
        <div className="carousel-nav">
          {/* Previous button */}
          <button
            className="carousel-nav-btn"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>

          {/* Dots indicator */}
          <div className="carousel-dots">
            {announcements.map((_, idx) => (
              <span
                key={idx}
                className={`carousel-dot ${idx === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>

          {/* Next/Done button */}
          <button
            className="carousel-nav-btn primary"
            onClick={handleNext}
          >
            {currentIndex < announcements.length - 1 ? "Next →" : "Done"}
          </button>
        </div>

        {/* Counter */}
        <div className="carousel-counter">
          {currentIndex + 1} / {announcements.length}
        </div>
      </div>
    </div>
  );
}
