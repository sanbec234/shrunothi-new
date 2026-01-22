import React from "react";
import './privacypolicy.css';

export default function PrivacyPolicy(): React.JSX.Element {
    return (
        <div className="privacy-root">
            <div className="privacy-policy">
                <div>
                    <h1>Privacy Policy</h1>
                    <p>Effective date: January 1, 2024</p>

                    <p>
                        Shrunothi ("we", "our", or "us") operates the Shrunothi web application (the "Service"). This Privacy Policy describes how we collect, use, and share your personal information when you use our Service.
                    </p>

                    <h2>Information We Collect</h2>
                    <ul>
                        <li><strong>Personal Information:</strong> We may collect personal information such as your name, email address, and profile picture when you sign up or log in using Google OAuth.</li>
                        <li><strong>Usage Data:</strong> We may collect information about how you access and use the Service, including your IP address, browser type, pages visited, and other diagnostic data.</li>
                    </ul>
                </div>
            </div>
    </div>
    );
}