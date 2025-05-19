import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSessionData } from "../hooks/api/use-chat-api";
import { useAuth } from "../lib/auth";
import Sidebar from "../components/Sidebar";
import MusicChatbot from "../components/MusicChatbot";

const ChatPage: React.FC = () => {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentMode, setCurrentMode] = useState<"fun" | "mentor" | "buddy">(
    "fun"
  );
  const [initialUserMessage, setInitialUserMessage] = useState<string>("");
  const [initialMessageLoaded, setInitialMessageLoaded] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Use TanStack Query to fetch session data
  const { data: sessionData = [], isLoading: loading } =
    useSessionData(sessionId);

  // Check for initial message and update mode from localStorage - CRITICAL FIX
  useEffect(() => {
    if (sessionId && !initialMessageLoaded) {
      // Try to get initial message from localStorage
      const storedInitialMessage = localStorage.getItem(
        `chat_initial_message_${sessionId}`
      );
      const storedMode = localStorage.getItem(`chat_initial_mode_${sessionId}`);

      // Debug
      console.log("Found stored message:", storedInitialMessage);
      console.log("Found stored mode:", storedMode);

      // If we have an initial message, process it
      if (storedInitialMessage && storedInitialMessage.trim() !== "") {
        setInitialUserMessage(storedInitialMessage);
        setInitialMessageLoaded(true);

        // Only remove from localStorage after successfully setting the state
        // and after a delay to ensure it's properly processed by MusicChatbot
        setTimeout(() => {
          localStorage.removeItem(`chat_initial_message_${sessionId}`);
        }, 1000);
      }

      // Update mode if available
      if (storedMode && ["fun", "mentor", "buddy"].includes(storedMode)) {
        setCurrentMode(storedMode as "fun" | "mentor" | "buddy");

        // Only remove from localStorage after successfully setting the state
        setTimeout(() => {
          localStorage.removeItem(`chat_initial_mode_${sessionId}`);
        }, 1000);
      }

      // Mark initial load as complete
      setInitialLoadComplete(true);
    }
  }, [sessionId, initialMessageLoaded]);

  // Update mode from session data
  useEffect(() => {
    if (sessionData && sessionData.length > 0) {
      // Sort by created_at to get the most recent message
      const sortedData = [...sessionData].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Set current mode from the most recent message
      const latestMode = sortedData[0].mode;
      if (latestMode && ["fun", "mentor", "buddy"].includes(latestMode)) {
        setCurrentMode(latestMode as "fun" | "mentor" | "buddy");
      }
    }
  }, [sessionData]);

  // Handle mode change from sidebar
  const handleModeChange = (mode: "fun" | "mentor" | "buddy") => {
    setCurrentMode(mode);
  };

  // Handle session selection from sidebar
  const handleSessionSelect = (newSessionId: string) => {
    // Reset the initial message state when switching sessions
    setInitialUserMessage("");
    setInitialMessageLoaded(false);
    setInitialLoadComplete(false);

    // Use React Router for client-side navigation
    navigate(`/chat/${newSessionId}`);
  };

  // Handle new chat button
  const handleNewChat = () => {
    // Reset the initial message state for new chats
    setInitialUserMessage("");
    setInitialMessageLoaded(false);
    setInitialLoadComplete(false);

    // Create a new session ID
    const newSessionId = uuidv4();

    // Navigate to new chat with this session ID
    navigate(`/chat/${newSessionId}`);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Debug what's being passed to MusicChatbot
  useEffect(() => {
    console.log(
      "Passing to MusicChatbot - initialUserMessage:",
      initialUserMessage
    );
    console.log("Passing to MusicChatbot - mode:", currentMode);
    console.log("Passing to MusicChatbot - sessionId:", sessionId);
  }, [initialUserMessage, currentMode, sessionId]);

  return (
    <div className="flex h-screen">
      {/* Sidebar handles its own chat history fetching */}
      <Sidebar
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        selectedSessionId={sessionId}
      />
      <div className="flex-1 overflow-hidden">
        {loading && !initialLoadComplete ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <MusicChatbot
            initialUserMessage={initialUserMessage}
            mode={currentMode}
            sessionId={sessionId}
            sessionData={sessionData}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
