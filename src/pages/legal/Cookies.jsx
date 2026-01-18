// src/pages/legal/Cookies.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Cookies() {
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
            Cookies Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

    

        {/* ---------------------------- */}
        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">1. What Are Cookies?</h2>
          <p className="text-sm leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. 
            They help websites function, remember preferences, and improve usability.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">2. How We Use Cookies</h2>
          <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed">
            <li>To maintain authentication and sessions.</li>
            <li>To remember your preferences.</li>
            <li>To analyze how the Service is used.</li>
            <li>To improve platform security.</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Types of Cookies We Use</h2>
          <ul className="list-disc pl-5 text-sm space-y-2 leading-relaxed">
            <li><strong>Necessary:</strong> Required for login, navigation, and security.</li>
            <li><strong>Preferences:</strong> Store UI and language settings.</li>
            <li><strong>Analytics:</strong> Provide insights into user behavior.</li>
            <li><strong>Third-party:</strong> Set by integrated tools or services.</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Third-Party Cookies</h2>
          <p className="text-sm leading-relaxed">
            Some cookies come from third-party providers. These services may track usage 
            across websites and follow their own privacy and cookies policies.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">5. Managing Cookies</h2>
          <p className="text-sm leading-relaxed mb-2">
            You have control over how cookies are used on your device.
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
            <li>Browsers allow blocking or deleting cookies.</li>
            <li>Extensions can manage tracking technologies.</li>
            <li>Disabling cookies may affect website functionality.</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">6. Updates to This Cookies Policy</h2>
          <p className="text-sm leading-relaxed">
            We may update this Policy periodically. The “Last updated” date will change when updates occur.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">7. Contact Us</h2>
          <p className="text-sm leading-relaxed">
            If you have questions about this Cookies Policy, email us at{" "}
            <a href="mailto:suppot@nexaloc.com" className="text-blue-600 hover:underline">
              suppot@nexaloc.com
            </a>.
          </p>
        </section>

        {/* Footer links */}
        <footer className="pt-6 border-t border-slate-200 text-sm flex gap-4">
          <Link to="/legal/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/legal/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>
        </footer>

      </div>
    </div>
  );
}
