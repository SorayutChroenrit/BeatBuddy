import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.VITE_BACKEND_URL;
console.log("API URL from env:", import.meta.env.VITE_BACKEND_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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
      console.log("Checking session at URL:", `${API_URL}/api/auth/session`);
      const response = await api.get("/api/auth/session");
      console.log("Session response:", response.data);
      setUser(response.data?.user || null);
    } catch (error) {
      console.error("Error checking session:", error);
      console.log("Full error object:", JSON.stringify(error, null, 2));
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
      window.location.href = `${API_URL}/api/auth/signin/${provider}`;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await api.post("/api/auth/signout");
      setUser(null);
      window.location.href = "/#/login";
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
