import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import AdminDashboard from "../pages/admin/admindash";
import { api } from "../api/client"; // adjust path if needed

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

  // ❌ Not logged in → show Google login
  if (!authUser) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Admin Login</h3>

          <GoogleLogin
            onSuccess={async (res) => {
              try {
                const response = await api.post("/auth/google", {
                  token: res.credential
                });

                const user = response.data;

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