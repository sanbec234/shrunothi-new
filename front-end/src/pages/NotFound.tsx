import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

const styles: Record<string, CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  code: { fontSize: "6rem", margin: 0 },
  text: { fontSize: "1.2rem", marginBottom: "1rem" },
  link: { color: "#2563eb", textDecoration: "none" },
};

export default function NotFound() {
  return (
    <div style={styles.container}>
      <h1 style={styles.code}>404</h1>
      <p style={styles.text}>Page not found</p>
      <Link to="/" style={styles.link}>Go back home</Link>
    </div>
  );
}