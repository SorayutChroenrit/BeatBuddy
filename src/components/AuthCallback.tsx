import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { checkSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async (): Promise<void> => {
      try {
        console.log("Auth callback: Processing authentication");

        // Refresh the session to get the newly authenticated user
        await checkSession();

        // Get the return URL from localStorage
        const returnUrl = localStorage.getItem("authReturnUrl") || "/";
        console.log("Auth callback: Redirecting to", returnUrl);

        // Clear the stored return URL
        localStorage.removeItem("authReturnUrl");

        // Navigate to the intended destination
        navigate(returnUrl);
      } catch (err) {
        console.error("Error handling auth callback:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [checkSession, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <p className="text-lg">Completing login...</p>
          <p>Please wait while we set up your session.</p>
        </>
      )}
    </div>
  );
};

export default AuthCallback;
