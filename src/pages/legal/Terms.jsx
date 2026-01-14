// src/pages/legal/Terms.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 shadow-sm rounded-2xl 
        border border-slate-200 dark:border-slate-700 p-8 space-y-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          ← Back
        </button>

        <header>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        

        {/* ---------------------------- */}
        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed">
            By accessing this Service, you agree to these Terms. If you do not agree, 
            you may not use the Service.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">2. Description of the Service</h2>
          <p className="text-sm leading-relaxed">
            Our platform provides digital tools for business management, analytics, 
            and project assistance. Features may evolve over time.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Eligibility</h2>
          <p className="text-sm leading-relaxed">
            You must be 18 or older and legally permitted to enter into agreements 
            to use the Service.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Accounts & Security</h2>
          <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed">
            <li>You are responsible for your account and login credentials.</li>
            <li>You must notify us of unauthorized access.</li>
            <li>We are not liable for losses due to compromised accounts.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">5. Acceptable Use</h2>
          <p className="text-sm leading-relaxed mb-2">
            You may not use the Service to:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed">
            <li>Violate laws</li>
            <li>Upload harmful content</li>
            <li>Attempt unauthorized access</li>
            <li>Interfere with Service operation</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">6. Intellectual Property</h2>
          <p className="text-sm leading-relaxed">
            All platform content and features are protected by intellectual property laws.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">7. User Content</h2>
          <p className="text-sm leading-relaxed">
            You own your content but grant us permission to host and process it to operate the Service.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">8. Third-Party Services</h2>
          <p className="text-sm leading-relaxed">
            We integrate with third-party tools. Their terms apply separately.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">9. Disclaimers</h2>
          <p className="text-sm leading-relaxed">
            The Service is provided “as is” without warranties of any kind.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">10. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed">
            We are not liable for indirect damages, including lost profits or data loss.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">11. Termination</h2>
          <p className="text-sm leading-relaxed">
            We may suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">12. Changes to These Terms</h2>
          <p className="text-sm leading-relaxed">
            We may update these Terms. Continued use constitutes acceptance.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">13. Contact Us</h2>
          <p className="text-sm leading-relaxed">
            For questions, contact{" "}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              support@example.com
            </a>.
          </p>
        </section>

        {/* Footer links */}
        <footer className="pt-6 border-t border-slate-200 text-sm flex gap-4">
          <Link to="/legal/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/legal/cookies" className="text-blue-600 hover:underline">
            Cookies Policy
          </Link>
        </footer>

      </div>
    </div>
  );
}
