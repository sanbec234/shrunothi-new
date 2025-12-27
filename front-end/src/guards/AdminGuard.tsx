import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import AdminDashboard from "../pages/admindash";

const API_BASE = "http://localhost:5001";

export default function AdminGuard() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const stored = localStorage.getItem("authUser");
    if (stored) {
      setAuthUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  // ❌ Not logged in → show Google login popup
  if (!authUser) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Admin Login</h3>

          <GoogleLogin
            onSuccess={async (res) => {
              try {
                const response = await fetch(`${API_BASE}/auth/google`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: res.credential })
                });

                const user = await response.json();
                localStorage.setItem("authUser", JSON.stringify(user));
                setAuthUser(user);
              } catch (err) {
                console.error("Login failed", err);
              }
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

  // ✅ Admin → allow dashboard
  return <AdminDashboard />;
}