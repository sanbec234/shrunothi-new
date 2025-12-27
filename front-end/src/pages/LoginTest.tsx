import { GoogleLogin } from "@react-oauth/google";

export default function LoginTest() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Google Auth Test</h1>
      {/* <GoogleLogin
        onSuccess={async (res) => {
          const googleToken = res.credential;

          const response = await fetch("http://localhost:5001/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: googleToken }),
          });

          const data = await response.json();
          console.log("AUTH RESPONSE:", data);
        }}
        onError={() => {
          console.log("Login failed");
        }}
      /> */}
      <GoogleLogin
        onSuccess={async (res) => {
          try {
            const response = await fetch("http://localhost:5001/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: res.credential })
            });

            const user = await response.json();

            // store login info
            localStorage.setItem("authUser", JSON.stringify(user));

            // optional: redirect
            if (user.role === "admin") {
              window.location.href = "/admin";
            } else {
              window.location.href = "/";
            }

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