import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowRight,
  Music,
  Sparkles,
  Book,
  Heart,
  History,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "../components/Sidebar";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { useChatHistory } from "../hooks/api/use-chat-api";
import { useAuth } from "../lib/auth";
import { Skeleton } from "../components/ui/skeleton";

// Define interface for chat session
interface SessionData {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageDate: Date;
  mode: string;
  formattedDate: string;
}

// Props for mode card component
interface ModeCardProps {
  mode: "fun" | "mentor" | "buddy";
  title: string;
  description: string;
  colorClasses: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [currentMode, setCurrentMode] = useState<"fun" | "mentor" | "buddy">(
    "fun"
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isNavigatingRef = useRef(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { user } = useAuth();

  // Format date for display
  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  };

  // Get abbreviated chat text for display
  const getShortText = (text: string, maxLength = 25): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Fetch chat history using the API
  const { data: chatHistoryData = [], isLoading: isLoadingHistory } =
    useChatHistory(user?.id || "");

  // Process chat history data into sessions
  const recentChatSessions = useMemo(() => {
    if (!chatHistoryData.length) return [];

    const sessionsMap = new Map<string, SessionData>();

    chatHistoryData.forEach((msg) => {
      if (!sessionsMap.has(msg.session_id)) {
        const sessionDate = new Date(msg.created_at);

        sessionsMap.set(msg.session_id, {
          id: msg.session_id,
          title: msg.query,
          lastMessage: msg.query,
          lastMessageDate: sessionDate,
          mode: msg.mode,
          formattedDate: formatDate(sessionDate),
        });
      } else {
        const existingSession = sessionsMap.get(msg.session_id);
        const msgDate = new Date(msg.created_at);

        if (existingSession && msgDate > existingSession.lastMessageDate) {
          existingSession.lastMessage = msg.query;
          existingSession.lastMessageDate = msgDate;
          existingSession.formattedDate = formatDate(msgDate);
          sessionsMap.set(msg.session_id, existingSession);
        }
      }
    });

    return Array.from(sessionsMap.values())
      .sort((a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime())
      .slice(0, 3); // Get only the 3 most recent sessions
  }, [chatHistoryData, formatDate]);

  // Use the same suggestions for all modes
  const commonSuggestions = [
    "Can you recommend songs from Adele?",
    "มีเพลงอะไรของ Adele น่าฟังบ้าง",
    "ขอเนื้อเพลง ขี้หึงของ Silly Fools",
    "ที่เป็นไปน่ะเป็นไปด้วยรัก แต่อาจจะขี้หึงเกินไป แต่ใจทั้งใจมีแต่เธอคนเดียว คือเพลงอะไร",
  ];

  // Updated suggestions object to use the same suggestions for all modes
  const suggestions: Record<string, string[]> = {
    fun: commonSuggestions,
    mentor: commonSuggestions,
    buddy: commonSuggestions,
  };

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

    // Store initial message and mode in localStorage properly
    try {
      localStorage.setItem(
        `chat_initial_message_${newSessionId}`,
        initialMessage.trim()
      );
      localStorage.setItem(`chat_initial_mode_${newSessionId}`, currentMode);

      // Add a forced delay to ensure localStorage updates before navigation
      setTimeout(() => {
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
    // Show suggestions when changing modes
    setShowSuggestions(true);
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

  const handleSuggestionClick = (suggestion: string) => {
    setInitialMessage(suggestion);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Mode card component
  const ModeCard: React.FC<ModeCardProps> = ({
    mode,
    title,
    description,
    colorClasses,
    icon,
    onClick,
  }) => (
    <motion.button
      onClick={onClick}
      className="text-left w-full focus:outline-none"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`bg-white p-5 rounded-xl shadow-sm transition-all ${
          currentMode === mode
            ? `ring-2 ${colorClasses} shadow-md`
            : `hover:ring-1 hover:${colorClasses.replace("ring-", "ring-")}`
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${colorClasses
              .replace("ring-", "bg-")
              .replace("400", "100")}`}
          >
            {icon}
          </div>
          <div>
            <h3
              className={`font-semibold text-lg mb-1 ${colorClasses
                .replace("ring-", "text-")
                .replace("400", "600")}`}
            >
              {title}
            </h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>
      </motion.div>
    </motion.button>
  );

  // Main page animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Sidebar
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 overflow-auto">
        <motion.div
          className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-3xl w-full flex flex-col items-center">
            {/* Logo and Title */}
            <motion.div
              className="flex items-center gap-3 mb-8"
              variants={itemVariants}
            >
              <motion.div
                className="bg-indigo-600 p-3 rounded-full shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Music className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-800">BeatBudd</h1>
            </motion.div>

            {/* Welcome Message */}
            <motion.h2
              className="text-2xl md:text-4xl font-semibold text-center mb-4 text-gray-800"
              variants={itemVariants}
            >
              <span className="text-indigo-600">♪</span> How can I help with
              your music today?
            </motion.h2>

            <motion.p
              className="text-lg text-gray-600 text-center mb-8"
              variants={itemVariants}
            >
              Your AI music companion for lyrics, song identification, and
              musical knowledge
            </motion.p>

            {/* Input Box */}
            <motion.div
              className="w-full bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
              variants={itemVariants}
            >
              <Textarea
                ref={inputRef}
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about song lyrics, identify tracks, or learn about music..."
                className="min-h-24 resize-none text-lg mb-4 p-4 rounded-lg border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />

              {/* Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-500 mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions[currentMode].map((suggestion, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-sm py-1 px-3 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center">
                <Button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  size="sm"
                  variant="outline"
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  {showSuggestions ? "Hide suggestions" : "Show suggestions"}
                </Button>

                <Button
                  onClick={handleStartChat}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  disabled={!initialMessage.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <motion.div
                      className="flex items-center"
                      whileHover={{ x: 5 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      Let's talk about music{" "}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.div>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Mode Selection Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
              variants={itemVariants}
            >
              <ModeCard
                mode="fun"
                title="Fun Mode"
                description="Just chat and have fun talking about music"
                colorClasses="ring-purple-400"
                icon={<Sparkles className="h-5 w-5 text-purple-500" />}
                onClick={() => handleModeSelect("fun")}
              />
              <ModeCard
                mode="mentor"
                title="Expert Mode"
                description="Chat with a music expert for detailed knowledge"
                colorClasses="ring-blue-400"
                icon={<Book className="h-5 w-5 text-blue-500" />}
                onClick={() => handleModeSelect("mentor")}
              />
              <ModeCard
                mode="buddy"
                title="Buddy Mode"
                description="Talk with a music buddy who understands you"
                colorClasses="ring-green-400"
                icon={<Heart className="h-5 w-5 text-green-500" />}
                onClick={() => handleModeSelect("buddy")}
              />
            </motion.div>

            {/* Recent Chats - Updated to use API */}
            <motion.div className="w-full mt-8" variants={itemVariants}>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <History className="h-4 w-4 mr-2" />
                Continue a recent conversation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {isLoadingHistory ? (
                  // Show skeleton loaders when loading
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-16 w-full rounded-lg bg-gray-100"
                    />
                  ))
                ) : recentChatSessions.length > 0 ? (
                  // Show recent chat sessions from API
                  recentChatSessions.map((session) => (
                    <motion.button
                      key={session.id}
                      className="p-3 bg-white rounded-lg border border-gray-200 text-left hover:bg-gray-50 hover:border-indigo-200 transition-colors"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSessionSelect(session.id)}
                    >
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {getShortText(session.title)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.formattedDate}
                      </p>
                    </motion.button>
                  ))
                ) : user ? (
                  // No chat history yet
                  <div className="col-span-3 text-center py-4 bg-white rounded-lg border border-gray-200">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">No chat history yet</p>
                    <p className="text-xs text-gray-400">
                      Start a new chat to see it here
                    </p>
                  </div>
                ) : (
                  // User not logged in
                  <div className="col-span-3 text-center py-4 bg-white rounded-lg border border-gray-200">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      Sign in to see your chat history
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
