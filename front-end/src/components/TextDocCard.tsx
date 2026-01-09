// import { useEffect, useState } from "react";
// import { api } from "../api/client";
// import type { TextDoc } from "../types";

// type Props = {
//   doc: TextDoc;
//   onClick?: () => void;
// };

// export default function TextDocCard({ doc, onClick }: Props) {
//   const [preview, setPreview] = useState<string>("");

//   useEffect(() => {
//     let mounted = true;

//     async function loadPreview() {
//       try {
//         const res = await api.get<{ content: string }>(
//           `/material/${doc.id}`
//         );

//         if (!mounted) return;

//         // Take first 2–3 meaningful lines as preview
//         const lines = res.data.content
//           .split("\n")
//           .map((l) => l.trim())
//           .filter(Boolean);

//         const words = lines.join(" ").split(" ").slice(0, 22);
//         setPreview(words.join(" ") + "…");

//       } catch (err) {
//         console.error("Failed to load preview", err);
//         setPreview("");
//       }
//     }

//     loadPreview();
//     return () => {
//       mounted = false;
//     };
//   }, [doc.id]);

//   return (
//     <div className="doc-card" onClick={onClick}>
//       <div className="doc-title">{doc.title}</div>
//       <div className="doc-author">{doc.author}</div>

//       {preview && (
//         <p className="doc-preview">{preview}</p>
//       )}
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TextDoc } from "../types";

type Props = {
  doc: TextDoc;
  onClick?: () => void;
};

function htmlToText(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function TextDocCard({ doc, onClick }: Props) {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function loadPreview() {
      try {
        const res = await api.get<{ content: string }>(
          `/material/${doc.id}`
        );

        if (!mounted) return;

        const text = htmlToText(res.data.content);

        const words = text
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .slice(0, 22);

        setPreview(words.join(" ") + "…");
      } catch (err) {
        console.error("Failed to load preview", err);
        setPreview("");
      }
    }

    loadPreview();
    return () => {
      mounted = false;
    };
  }, [doc.id]);

  return (
    <div className="doc-card" onClick={onClick}>
      <div className="doc-title">{doc.title}</div>
      <div className="doc-author">{doc.author}</div>

      {preview && <p className="doc-preview">{preview}</p>}
    </div>
  );
}