import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Music } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "../components/Sidebar";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [currentMode, setCurrentMode] = useState<"fun" | "mentor" | "buddy">(
    "fun"
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isNavigatingRef = useRef(false);

  // Focus input when component loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handler function for keyboard events only
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };

  // Separate handler for button click and actual chat initiation
  const handleStartChat = () => {
    // Check for empty message or already in progress
    if (
      initialMessage.trim() === "" ||
      isSubmitting ||
      isNavigatingRef.current
    ) {
      return;
    }

    // Set flags to prevent duplicate submissions
    setIsSubmitting(true);
    isNavigatingRef.current = true;

    // Generate a session ID
    const newSessionId = uuidv4();

    console.log(
      `Starting chat with message: "${initialMessage}" and mode: ${currentMode}`
    );

    // CRITICAL FIX: Store initial message and mode in localStorage properly
    try {
      localStorage.setItem(
        `chat_initial_message_${newSessionId}`,
        initialMessage.trim()
      );
      localStorage.setItem(`chat_initial_mode_${newSessionId}`, currentMode);

      console.log("Stored message in localStorage:", initialMessage.trim());
      console.log("Stored mode in localStorage:", currentMode);
      console.log("Storage key:", `chat_initial_message_${newSessionId}`);

      // Add a forced delay to ensure localStorage updates before navigation
      setTimeout(() => {
        // Verify the message was stored properly
        const verifyMessage = localStorage.getItem(
          `chat_initial_message_${newSessionId}`
        );
        console.log("Verification - message in localStorage:", verifyMessage);

        // Navigate to chat page
        navigate(`/chat/${newSessionId}`);
      }, 100);
    } catch (error) {
      console.error("Error storing message in localStorage:", error);
      setIsSubmitting(false);
      isNavigatingRef.current = false;
    }
  };

  const handleModeChange = (mode: "fun" | "mentor" | "buddy") => {
    setCurrentMode(mode);
  };

  const handleModeSelect = (mode: "fun" | "mentor" | "buddy") => {
    setCurrentMode(mode);
    // Focus input after selecting mode
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSessionSelect = (sessionId: string) => {
    // Prevent multiple clicks during navigation
    if (isSubmitting || isNavigatingRef.current) {
      return;
    }

    setIsSubmitting(true);
    isNavigatingRef.current = true;
    navigate(`/chat/${sessionId}`);
  };

  const handleNewChat = () => {
    setInitialMessage("");
    setIsSubmitting(false);
    isNavigatingRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Mode card component
  const ModeCard = ({
    mode,
    title,
    description,
    colorClasses,
    onClick,
  }: {
    mode: "fun" | "mentor" | "buddy";
    title: string;
    description: string;
    colorClasses: string;
    onClick: () => void;
  }) => (
    <button onClick={onClick} className="text-left w-full focus:outline-none">
      <div
        className={`bg-white p-4 rounded-lg shadow-sm transition-colors ${
          currentMode === mode
            ? `ring-2 ${colorClasses}`
            : `hover:ring-1 hover:${colorClasses.replace("ring-", "ring-")}`
        }`}
      >
        <h3
          className={`font-semibold text-lg mb-2 ${colorClasses.replace(
            "ring-",
            "text-"
          )}`}
        >
          {title}
        </h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="flex h-screen">
      <Sidebar
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4">
          <div className="max-w-2xl w-full flex flex-col items-center">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-500 p-2 rounded-full">
                <Music className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-center">Beat Buddy</h1>
            </div>

            {/* Welcome Message */}
            <h2 className="text-2xl md:text-4xl font-semibold text-center mb-6">
              <span className="text-indigo-500">♪</span> How can I help with
              your music today?
            </h2>

            <p className="text-lg text-gray-600 text-center mb-8">
              Your AI music companion for recommendations, practice advice, and
              fun facts
            </p>

            {/* Input Box */}
            <div className="w-full bg-white rounded-lg shadow-md p-6 mb-6">
              <Textarea
                ref={inputRef}
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about music, theory, or get recommendations..."
                className="min-h-20 resize-none text-lg mb-4 p-4"
                rows={3}
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleStartChat}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={!initialMessage.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    "Starting chat..."
                  ) : (
                    <>
                      Let's talk about music{" "}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <ModeCard
                mode="fun"
                title="Fun Mode"
                description="Get fun facts and light conversation about music"
                colorClasses="ring-purple-400"
                onClick={() => handleModeSelect("fun")}
              />
              <ModeCard
                mode="mentor"
                title="Expert Mode"
                description="Receive technical advice and learning resources"
                colorClasses="ring-blue-400"
                onClick={() => handleModeSelect("mentor")}
              />
              <ModeCard
                mode="buddy"
                title="Buddy Mode"
                description="Get encouragement and support for your musical journey"
                colorClasses="ring-green-400"
                onClick={() => handleModeSelect("buddy")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
