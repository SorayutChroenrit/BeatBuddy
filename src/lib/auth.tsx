import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

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
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async (): Promise<void> => {
    try {
      const response = await api.get("/api/auth/session");
      setUser(response.data?.user || null);
    } catch (error) {
      console.error("Error checking session:", error);
      console.log("Full error object:", JSON.stringify(error, null, 2));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (provider: string): Promise<void> => {
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

  const signOut = async (): Promise<void> => {
    try {
      await api.post("/api/auth/signout");
      setUser(null);
      window.location.href = "/BeatBuddy/#/login";
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, loading, checkSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default api;
