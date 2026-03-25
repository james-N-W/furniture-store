// AuthContext.jsx
// createContext — creates a "global container" for sharing data
// useContext — lets any component read from that container
// useEffect — runs code when the component first loads
// useState — stores a value that can change over time

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // user = the logged-in user object, or null if nobody is logged in
  const [user, setUser] = useState(null);
  // loading = true while Firebase is checking if a session exists
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase calls this function automatically whenever login state changes:
    // on page load, after login, after logout
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // store whoever is logged in (or null)
      setLoading(false);    // done checking — safe to show the app
    });

    // cleanup: stop listening when this component is removed from the page
    return unsubscribe;
  }, []); // empty [] means "run this once when the app first loads"

  return (
    <AuthContext.Provider value={{ user }}>
      {/* Don't render anything until Firebase confirms the auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component can call useAuth() to get the current user
// Example: const { user } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}