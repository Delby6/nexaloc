// src/pages/legal/Privacy.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 shadow-sm rounded-2xl 
        border border-slate-200 dark:border-slate-700 p-8 space-y-8">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          ← Back
        </button>

        <header>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        

        {/* ---------------------------- */}
        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-sm leading-relaxed">
            This Privacy Policy explains how we collect, use, store, and protect your personal data.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
            <li>Account and profile information</li>
            <li>Business and project data</li>
            <li>Device and browser metadata</li>
            <li>Analytics and usage data</li>
            <li>Communication and support messages</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed">
            <li>Provide and maintain the Service</li>
            <li>Improve performance and functionality</li>
            <li>Provide support and communicate updates</li>
            <li>Personalize your experience</li>
            <li>Ensure security and fraud prevention</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Legal Bases for Processing</h2>
          <p className="text-sm leading-relaxed">
            When required by GDPR, processing is based on: your consent, contract performance, 
            legitimate interests, and compliance with legal obligations.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">5. Sharing Your Information</h2>
          <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed">
            <li>Service providers & platform tools</li>
            <li>Business integrations you enable</li>
            <li>Analytics and performance tools</li>
            <li>Legal authorities when required</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">6. Data Retention</h2>
          <p className="text-sm leading-relaxed">
            We retain your data as long as necessary for Service operation, legal compliance, 
            or account management.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">7. Your Rights</h2>
          <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed">
            <li>Access your data</li>
            <li>Request corrections or deletion</li>
            <li>Object to processing</li>
            <li>Request export (data portability)</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">8. Cookies & Tracking Technologies</h2>
          <p className="text-sm leading-relaxed">
            We use cookies to remember your preferences, provide authentication, and understand app performance. 
            See our{" "}
            <Link className="text-blue-600 hover:underline" to="/legal/cookies">
              Cookies Policy
            </Link>.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">9. Data Security</h2>
          <p className="text-sm leading-relaxed">
            We implement security measures to protect your data, but no system is 100% secure.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">10. International Transfers</h2>
          <p className="text-sm leading-relaxed">
            Your data may be processed in countries other than your own, with appropriate safeguards in place.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">11. Changes to This Privacy Policy</h2>
          <p className="text-sm leading-relaxed">
            We may update this Policy periodically. Continued use of the Service constitutes acceptance.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">12. Contact Us</h2>
          <p className="text-sm leading-relaxed">
            For privacy questions, email{" "}
            <a href="mailto:support@nexaloc.com" className="text-blue-600 hover:underline">
              support@nexaloc.com
            </a>.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-200 text-sm flex gap-4">
          <Link to="/legal/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>
          <Link to="/legal/cookies" className="text-blue-600 hover:underline">
            Cookies Policy
          </Link>
        </footer>

      </div>
    </div>
  );
}
