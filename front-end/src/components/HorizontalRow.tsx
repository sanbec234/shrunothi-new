import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function HorizontalRow({ title, children }: Props) {
  return (
    <section className="row-section">
      <h2 className="row-title">{title}</h2>

      <div className="row-scroll" role="region" aria-label={title}>
        {children}
      </div>
    </section>
  );
}
