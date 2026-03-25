// Login.jsx
// useState — stores the values the user types into the form
// useNavigate — redirects the user after successful login
// signInWithEmailAndPassword — Firebase function that checks
//   the email/password against your Auth database

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";


export default function Login() {
  // These store whatever the user types in real time
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // error stores any message we want to show the user (e.g. wrong password)
  const [error, setError] = useState("");
  // loading prevents double-clicks while Firebase is processing
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e) {
    // e.preventDefault() stops the page from refreshing on form submit
    // — default browser behaviour we don't want in React
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Firebase checks the email + password against your Auth users list
      // If correct → returns a user object and updates AuthContext automatically
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // send them to the home page on success
    } catch (err) {
      // Firebase returns specific error codes we can show the user
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect email or password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      // finally runs whether the try succeeded or the catch fired
      // — always stop the loading spinner either way
      setLoading(false);
    }
  }

  return (
    // min-h-screen — takes up the full screen height
    // flex items-center justify-center — centres content vertically and horizontally
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue</p>

        {/* Error message — only shows if error state is not empty */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Form — onSubmit calls handleLogin when the button is clicked */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              // value ties the input to our state
              // onChange updates state every time the user types a character
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
          {/* Label row — "Password" on the left, "Forgot password?" on the right */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Link
              to="/reset-password"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            name="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
          
          

          <button
            type="submit"
            disabled={loading}
            // disabled:opacity-50 — greys out the button while loading
            // disabled:cursor-not-allowed — shows a "no" cursor on hover
            className="bg-gray-800 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>
        

        {/* Link to register page */}
        <p className="text-sm text-gray-500 text-center mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-gray-800 font-medium hover:underline">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}