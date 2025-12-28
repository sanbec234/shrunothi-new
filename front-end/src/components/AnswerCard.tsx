export default function AnswerCard({ text }: { text: string }) {
  return (
    <div className="answer-card">
      <div className="answer-text">{text}</div>
    </div>
  );
}
