import { GoogleLogin } from "@react-oauth/google";
import { api } from "../api/client";

type Props = {
  onSuccess?: () => void;
  onClose?: () => void;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2000,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  background: "rgba(15, 23, 42, 0.45)", // ⬅️ was 0.35
  backdropFilter: "blur(0.9rem)"
};

// const popupStyle: React.CSSProperties = {
//   position: "relative",

//   width: "22rem",
//   maxWidth: "90vw",
//   padding: "2rem 1.75rem 1.75rem",

//   textAlign: "center",

//   background: `
//     linear-gradient(
//       135deg,
//       rgba(83, 148, 207, 0.32),
//       rgba(220, 132, 101, 0.26)
//     )
//   `,
//   backdropFilter: "blur(1.2rem) saturate(150%)",
//   WebkitBackdropFilter: "blur(1.2rem) saturate(150%)",

//   borderRadius: "1.25rem",
//   border: "1px solid rgba(255,255,255,0.45)",

//   boxShadow: `
//     0 1.4rem 3.2rem rgba(15, 23, 42, 0.35),
//     inset 0 0.0625rem 0 rgba(255,255,255,0.45)
//   `
// };

const popupStyle: React.CSSProperties = {
  position: "relative",

  width: "22rem",
  maxWidth: "90vw",
  padding: "2.2rem 1.9rem 1.9rem",

  textAlign: "center",

  background: `
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.78),
      rgba(255, 255, 255, 0.72)
    )
  `,
  
  backdropFilter: "blur(0.9rem) saturate(155%)",
  WebkitBackdropFilter: "blur(0.9rem) saturate(155%)",

  borderRadius: "1.4rem",
  border: "1px solid rgba(255,255,255,0.55)",

  boxShadow: `
    0 1.6rem 3.6rem rgba(15, 23, 42, 0.42),
    inset 0 0.08rem 0 rgba(255,255,255,0.55)
  `
};

const closeStyle: React.CSSProperties = {
  position: "absolute",
  top: "0.8rem",
  right: "0.9rem",

  width: "2.1rem",
  height: "2.1rem",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  background: "rgba(255,255,255,2)", // ⬅️ stronger
  backdropFilter: "blur(0.6rem)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "50%",

  fontSize: "1.1rem",
  fontWeight: 600,
  color: "#0f172a",
  cursor: "pointer",

  boxShadow: "0 0.35rem 0.8rem rgba(0,0,0,0.22)"
};

export default function GoogleAuthPopup({ onSuccess, onClose }: Props) {
  return (
    <div style={overlayStyle}>
      <div style={popupStyle}>
        <button
          style={closeStyle}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h3
          style={{
            marginBottom: "1rem",
            fontSize: "1.15rem",
            fontWeight: 600,
            color: "#0f172a"
          }}
        >
          Sign in with Google
        </h3>

        <p
          style={{
            fontSize: "0.85rem",
            color: "#334155",
            marginBottom: "1.4rem",
            lineHeight: 1.4
          }}
        >
          Continue to access curated podcasts, materials, and self-help content.
        </p>

        {/* Google button stays REAL */}
        <div
          style={{
            display: "flex",
            justifyContent: "center"
          }}
        >
          <GoogleLogin
            onSuccess={async (res) => {
              try {
                const response = await api.post("/auth/google", {
                  token: res.credential
                });

                const user = response.data;
                localStorage.setItem("authUser", JSON.stringify(user));

                onSuccess?.();
              } catch (err) {
                console.error("Login error", err);
              }
            }}
            onError={() => {
              console.log("Login failed");
            }}
          />
        </div>
      </div>
    </div>
  );
}