// ResetPassword.jsx
// sendPasswordResetEmail — Firebase function that sends a password
// reset link to the user's email address. Firebase handles the
// entire flow — the email, the link, and the actual password change.
// You don't need to build any of that yourself.

import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Firebase sends a password reset email to this address
      // The email contains a secure link that expires after 1 hour
      // If the email doesn't exist in your Auth database, Firebase
      // still shows success — this prevents exposing which emails
      // are registered (a security best practice)
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Success state — email sent ──
  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md text-center">

          {/* Envelope icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-2">
            We sent a password reset link to:
          </p>
          <p className="text-sm font-medium text-gray-800 mb-6">{email}</p>
          <p className="text-xs text-gray-400 mb-6">
            The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>

          {/* Let them try again if they didn't get the email */}
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-sm text-gray-500 hover:text-gray-800 underline"
          >
            Try a different email
          </button>

          <div className="mt-4">
            <Link to="/login" className="text-sm text-gray-800 font-medium hover:underline">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Default state — reset form ──
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Reset password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="reset-email"
              name="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-800 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Remember your password?{" "}
          <Link to="/login" className="text-gray-800 font-medium hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}