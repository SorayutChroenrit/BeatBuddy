import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthContextType {
  user: User | null;
  signIn: (provider: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const session = await response.json();
        setUser(session?.user || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (provider: string) => {
    try {
      // Save the current hash location to return to after login
      const returnUrl = window.location.hash.substring(1) || "/";
      // Store return URL in localStorage
      localStorage.setItem("authReturnUrl", returnUrl);

      // Redirect to auth endpoint
      window.location.href = `http://localhost:8000/api/auth/signin/${provider}`;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        window.location.href = "/#/login";
      } else {
        throw new Error("Failed to sign out");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
