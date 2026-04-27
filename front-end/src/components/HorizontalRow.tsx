import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  id?: string;
};

export default function HorizontalRow({ title, children, id }: Props) {
  return (
    <section className="row-section" id={id}>
      {/* Section header with orange left bar  (Figma design) */}
      <div className="section-header">
        <span className="section-bar" />
        <h2 className="section-title">{title}</h2>
      </div>

      <div className="row-scroll scroll-x" role="region" aria-label={title}>
        {children}
      </div>
    </section>
  );
}
