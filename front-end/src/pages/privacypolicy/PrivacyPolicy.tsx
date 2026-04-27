import React from "react";
import "./privacypolicy.css";

export default function PrivacyPolicy(): React.JSX.Element {
  const authUserRaw = localStorage.getItem("authUser");
  let authUser: { name?: string } | null = null;

  if (authUserRaw) {
    try {
      authUser = JSON.parse(authUserRaw) as { name?: string };
    } catch {
      authUser = null;
    }
  }

  const displayName = authUser?.name ? `Howdy, ${authUser.name}!` : "Welcome";

  return (
    <div className="legal-root">
      <header className="legal-header">
        <div className="legal-brand">
          <img src="/logo.png" alt="Shrunothi" className="legal-brand__logo" />
          <span className="legal-brand__title">Shrunothi Legal</span>
        </div>
        <div className="legal-pill" aria-live="polite">
          {displayName}
        </div>
      </header>

      <main className="legal-main">
        <article className="legal-card">
          <h1>Privacy Policy &amp; Terms of Service – Shrunothi</h1>

          <h2>Privacy Policy</h2>
          <p>Last updated: 27/01/2026</p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to Shrunothi (“we”, “us”, “our”). This Privacy Policy explains
            how we collect, use, and protect your personal information when you
            use our website www.shrunothi.com (the “website”). By using the website,
            you agree to the terms of this Privacy Policy.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We may collect personal information such as your name and email
            address when you voluntarily submit them. We may also collect usage
            data such as IP address, browser type, pages visited, and time spent
            on the website.
          </p>

          <h2>3. How We Use Information</h2>
          <p>
            Information is used to operate and improve the website, respond to
            queries, communicate updates, and comply with legal obligations.
          </p>

          <h2>4. Cookies and Tracking</h2>
          <p>
            Cookies may be used to improve functionality and analyze website
            usage. You can control cookies through browser settings.
          </p>

          <h2>5. Sharing of Information</h2>
          <p>
            We do not sell personal data. Information may be shared with service
            providers or legal authorities if required.
          </p>

          <h2>6. Data Security</h2>
          <p>
            Reasonable security measures are taken, but complete security cannot
            be guaranteed.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            Data is retained only as long as necessary for stated purposes or
            legal compliance.
          </p>

          <h2>8. User Rights</h2>
          <p>
            Users may request access, correction, deletion, or withdrawal of
            consent by contacting us.
          </p>

          <h2>9. Children’s Privacy</h2>
          <p>The website is not intended for users under 16 years of age.</p>

          <h2>10. Changes</h2>
          <p>Updates to this policy will be posted with a revised date.</p>

          <p>
            <strong>Contact:</strong> shrunothi@gmail.com
          </p>
        </article>
      </main>
    </div>
  );
}
