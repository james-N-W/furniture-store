// Register.jsx
// createUserWithEmailAndPassword — Firebase function that creates
//   a new user in your Auth database
// setDoc + doc — Firestore functions that create a document
//   in your database to store the user's role

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    // Check passwords match before sending anything to Firebase
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must meet the following requirements:\n" +
                      "- At least 6 characters\n" +
                      "- Include a number\n" +
                      "- Include uppercase and lowercase letters\n" +
                      "- Include a special character");
    }

    setLoading(true);

    try {
      // Step 1 — create the user in Firebase Auth
      // This gives us back a "credential" object containing the new user
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Step 2 — create a matching document in Firestore
      // We store their role here. doc(db, "users", uid) means:
      // in the "users" collection, create a document with their user ID as the key
      await setDoc(doc(db, "users", credential.user.uid), {
        email: email,
        role: "customer", // default role — you manually change this to "admin" for yourself
        createdAt: new Date(),
      });

      navigate("/"); // redirect home after successful registration
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Password must meet the following requirements:\n" +
                  "- At least 6 characters\n" +
                  "- Include a number\n" +
                  "- Include uppercase and lowercase letters\n" +
                  "- Include a special character");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Create an account</h1>
        <p className="text-sm text-gray-500 mb-6">Join to make purchases or request custom designs</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-800 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gray-800 font-medium hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}