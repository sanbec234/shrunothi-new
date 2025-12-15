type Podcast = {
  id?: string;
  embed_url: string;
  title?: string;
};

export default function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <div className="podcast-card">
      {podcast.title && (
        <div className="podcast-title">{podcast.title}</div>
      )}

      <iframe
        src={podcast.embed_url}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
