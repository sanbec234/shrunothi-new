type Props = {
  imageUrl: string;
  title?: string;
  onClose: () => void;
};

export default function AnnouncementPopup({ imageUrl, title, onClose }: Props) {
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {title && <h3 className="modal-title">{title}</h3>}

        <img
          src={imageUrl}
          alt={title || "Announcement"}
          style={{
            width: "100%",
            borderRadius: "12px",
            marginTop: "0.75rem",
          }}
        />
      </div>
    </div>
  );
}