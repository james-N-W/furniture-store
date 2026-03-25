// Navbar.jsx
// Redesigned for THE GRAIN — editorial style with warm tones
// The logo uses a serif display font to match the brand identity

import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  // mobileOpen — controls whether the mobile menu is visible
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) checkRole();
    else setIsAdmin(false);
  }, [user]);

  async function checkRole() {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      setIsAdmin(userDoc.exists() && userDoc.data().role === "admin");
    } catch { setIsAdmin(false); }
  }

  async function handleLogout() {
    await signOut(auth);
    setIsAdmin(false);
    navigate("/");
  }

  return (
    <nav style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}
      className="px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="font-display text-2xl tracking-tight"
          style={{ color: "var(--charcoal)" }}>
          BROTSIT INTERIORS
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm tracking-wide hover:opacity-60 transition"
            style={{ color: "var(--warm-gray)" }}>
            Collection
          </Link>
          {user && (
            <Link to="/custom-order" className="text-sm tracking-wide hover:opacity-60 transition"
              style={{ color: "var(--warm-gray)" }}>
              Custom Order
            </Link>
          )}
          {user && (
            <Link to="/orders" className="text-sm tracking-wide hover:opacity-60 transition"
              style={{ color: "var(--warm-gray)" }}>
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm tracking-wide hover:opacity-60 transition"
              style={{ color: "var(--warm-gray)" }}>
              Admin
            </Link>
          )}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <button onClick={handleLogout}
              className="text-sm px-5 py-2 rounded-full border transition hover:opacity-70"
              style={{ borderColor: "var(--charcoal)", color: "var(--charcoal)" }}>
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login"
                className="text-sm tracking-wide hover:opacity-60 transition"
                style={{ color: "var(--warm-gray)" }}>
                Sign in
              </Link>
              <Link to="/register"
                className="text-sm px-5 py-2 rounded-full transition"
                style={{ background: "var(--charcoal)", color: "var(--cream)" }}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {/* Three lines that form the hamburger icon */}
          <span className="block w-6 h-px transition-all"
            style={{ background: "var(--charcoal)", transform: mobileOpen ? "rotate(45deg) translate(2px, 2px)" : "" }} />
          <span className="block w-6 h-px transition-all"
            style={{ background: "var(--charcoal)", opacity: mobileOpen ? 0 : 1 }} />
          <span className="block w-6 h-px transition-all"
            style={{ background: "var(--charcoal)", transform: mobileOpen ? "rotate(-45deg) translate(2px, -2px)" : "" }} />
        </button>
      </div>

      {/* Mobile menu — slides down when hamburger is clicked */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col gap-4 border-t pt-4"
          style={{ borderColor: "var(--border)" }}>
          <Link to="/" onClick={() => setMobileOpen(false)}
            className="text-sm" style={{ color: "var(--warm-gray)" }}>Collection</Link>
          {user && <Link to="/custom-order" onClick={() => setMobileOpen(false)}
            className="text-sm" style={{ color: "var(--warm-gray)" }}>Custom Order</Link>}
          {user && <Link to="/orders" onClick={() => setMobileOpen(false)}
            className="text-sm" style={{ color: "var(--warm-gray)" }}>My Orders</Link>}
          {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)}
            className="text-sm" style={{ color: "var(--warm-gray)" }}>Admin</Link>}
          {user ? (
            <button onClick={handleLogout} className="text-sm text-left"
              style={{ color: "var(--warm-gray)" }}>Sign out</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="text-sm" style={{ color: "var(--warm-gray)" }}>Sign in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="text-sm" style={{ color: "var(--warm-gray)" }}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}