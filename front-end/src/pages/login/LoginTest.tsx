import { GoogleLogin } from "@react-oauth/google";
import { api } from "../../api/client";

export default function LoginTest() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Google Auth Test</h1>

      <GoogleLogin
        onSuccess={async (res) => {
          try {
            const response = await api.post("/auth/google", {
              token: res.credential
            });

            const user = response.data;

            localStorage.setItem("authUser", JSON.stringify(user));

            window.location.href =
              user.role === "admin" ? "/admin" : "/";

          } catch (err) {
            console.error("Login error", err);
          }
        }}
        onError={() => {
          console.log("Login failed");
        }}
      />
    </div>
  );
}