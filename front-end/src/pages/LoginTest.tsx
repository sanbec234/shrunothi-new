import { GoogleLogin } from "@react-oauth/google";

export default function LoginTest() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Google Auth Test</h1>

      <GoogleLogin
        onSuccess={(res) => {
          console.log("Google token:", res.credential);
        }}
        onError={() => {
          console.log("Login failed");
        }}
      />
    </div>
  );
}