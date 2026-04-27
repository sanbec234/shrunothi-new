// import { useEffect, useState } from "react";
// import { GoogleLogin } from "@react-oauth/google";
// import AdminDashboard from "../pages/admin/admindash";
// import { api } from "../api/client"; // adjust path if needed

// export default function AdminGuard() {
//   const [authUser, setAuthUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const stored = localStorage.getItem("authUser");
//     if (stored) {
//       setAuthUser(JSON.parse(stored));
//     }
//     setLoading(false);
//   }, []);

//   if (loading) return null;

//   // ❌ Not logged in → show Google login
//   if (!authUser) {
//     return (
//       <div className="modal-overlay">
//         <div className="modal">
//           <h3>Admin Login</h3>

//           <GoogleLogin
//             onSuccess={async (res) => {
//               if (!res.credential) return;

//               // 🔑 ALSO REQUIRED HERE
//               localStorage.setItem("google_id_token", res.credential);

//               const response = await api.post("/auth/google", {
//                 token: res.credential,
//               });

//               const user = response.data;
//               localStorage.setItem("authUser", JSON.stringify(user));
//               setAuthUser(user);
//             }}
//             onError={() => console.log("Google login failed")}
//           />
//         </div>
//       </div>
//     );
//   }

//   // ❌ Logged in but not admin
//   if (authUser.role !== "admin") {
//     return <h2 style={{ padding: 40 }}>Access denied</h2>;
//   }

//   // ✅ Admin → allow dashboard
//   return <AdminDashboard />;
// }

import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import AdminDashboard from "../pages/admin/admindash";
import { api } from "../api/client";

export default function AdminGuard() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // 🔍 check for expired-session flag (set by axios interceptor)
    const expired = sessionStorage.getItem("session_expired");
    if (expired) {
      setSessionExpired(true);
      sessionStorage.removeItem("session_expired");
    }

    const stored = localStorage.getItem("authUser");
    if (stored) {
      setAuthUser(JSON.parse(stored));
    }

    setLoading(false);
  }, []);

  if (loading) return null;

  // ❌ Not logged in → show login
  if (!authUser) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Admin Login</h3>

          {sessionExpired && (
            <p style={{ color: "#dc2626", marginBottom: "1rem" }}>
              Your session expired. Please sign in again.
            </p>
          )}

          <GoogleLogin
            onSuccess={async (res) => {
              if (!res.credential) return;

              // 🔑 store Google ID token
              localStorage.setItem("google_id_token", res.credential);

              const response = await api.post("/auth/google", {
                token: res.credential,
              });

              const user = response.data;
              localStorage.setItem("authUser", JSON.stringify(user));
              setAuthUser(user);
            }}
            onError={() => console.log("Google login failed")}
          />
        </div>
      </div>
    );
  }

  // ❌ Logged in but not admin
  if (authUser.role !== "admin") {
    return <h2 style={{ padding: 40 }}>Access denied</h2>;
  }

  // ✅ Admin
  return <AdminDashboard />;
}