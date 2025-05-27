import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "../components/Sidebar";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { useChatHistory } from "../hooks/api/use-chat-api";
import { useAuth } from "../lib/auth";
import { Skeleton } from "../components/ui/skeleton";

// Type definitions
interface SessionData {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageDate: Date;
  mode: string;
  formattedDate: string;
}

interface ModeCardProps {
  mode: "fun" | "mentor" | "buddy";
  title: string;
  description: string;
  colorClasses: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
  index: number;
}

interface ChatSessionData {
  session_id: string;
  query: string;
  created_at: string;
  mode: string;
}

interface User {
  id: string;
  // Add other user properties as needed
}

type ChatMode = "fun" | "mentor" | "buddy";

// Animation variants
const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
      duration: 0.6,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.25, 0, 1],
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const logoVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: 0.2,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

const inputContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: "easeOut",
      delay: 0.3,
    },
  },
};

const modeCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.8,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.25, 0, 1],
      delay: 0.5 + index * 0.1,
    },
  }),
  hover: {
    scale: 1.05,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

const activeCardVariants: Variants = {
  active: {
    scale: 1.02,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  inactive: {
    scale: 1,
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

const chatSessionVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      delay: index * 0.1,
    },
  }),
  hover: {
    scale: 1.03,
    y: -3,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.97,
  },
};

const suggestionVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 10,
  },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: index * 0.05,
    },
  }),
  hover: {
    scale: 1.05,
    backgroundColor: "#e0e7ff",
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const skeletonVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (index: number) => ({
    opacity: 1,
    transition: {
      duration: 0.3,
      delay: index * 0.1,
    },
  }),
};

const buttonVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [currentMode, setCurrentMode] = useState<ChatMode>("fun");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isNavigatingRef = useRef<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const { user }: { user: User | null } = useAuth();

  // Format date for display
  const formatDate = useCallback((date: Date): string => {
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
  }, []);

  // Get abbreviated chat text for display
  const getShortText = useCallback(
    (text: string, maxLength: number = 25): string => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    },
    []
  );

  // Fetch chat history using the API
  const { data: chatHistoryData = [], isLoading: isLoadingHistory } =
    useChatHistory(user?.id || "");

  // Process chat history data into sessions
  const recentChatSessions = useMemo(() => {
    if (!chatHistoryData.length) return [];

    const sessionsMap = new Map<string, SessionData>();

    chatHistoryData.forEach((msg: ChatSessionData) => {
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
      .slice(0, 3);
  }, [chatHistoryData, formatDate]);

  // Suggestions for all modes
  const commonSuggestions: string[] = [
    "Can you recommend songs from Adele?",
    "มีเพลงอะไรของ Adele น่าฟังบ้าง",
    "ขอเนื้อเพลง ขี้หึงของ Silly Fools",
    "ที่เป็นไปน่ะเป็นไปด้วยรัก แต่อาจจะขี้หึงเกินไป แต่ใจทั้งใจมีแต่เธอคนเดียว คือเพลงอะไร",
  ];

  const suggestions: Record<ChatMode, string[]> = {
    fun: commonSuggestions,
    mentor: commonSuggestions,
    buddy: commonSuggestions,
  };

  // Focus input when component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 800); // Delay to allow animations to complete

    return () => clearTimeout(timer);
  }, []);

  // Handler function for keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleStartChat();
      }
    },
    []
  );

  // Chat initiation handler
  const handleStartChat = useCallback((): void => {
    if (
      initialMessage.trim() === "" ||
      isSubmitting ||
      isNavigatingRef.current
    ) {
      return;
    }

    setIsSubmitting(true);
    isNavigatingRef.current = true;

    const newSessionId = uuidv4();

    try {
      localStorage.setItem(
        `chat_initial_message_${newSessionId}`,
        initialMessage.trim()
      );
      localStorage.setItem(`chat_initial_mode_${newSessionId}`, currentMode);

      setTimeout(() => {
        navigate(`/chat/${newSessionId}`);
      }, 100);
    } catch (error) {
      console.error("Error storing message in localStorage:", error);
      setIsSubmitting(false);
      isNavigatingRef.current = false;
    }
  }, [initialMessage, isSubmitting, currentMode, navigate]);

  const handleModeChange = useCallback((mode: ChatMode): void => {
    setCurrentMode(mode);
  }, []);

  const handleModeSelect = useCallback((mode: ChatMode): void => {
    setCurrentMode(mode);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSessionSelect = useCallback(
    (sessionId: string): void => {
      if (isSubmitting || isNavigatingRef.current) {
        return;
      }

      setIsSubmitting(true);
      isNavigatingRef.current = true;
      navigate(`/chat/${sessionId}`);
    },
    [isSubmitting, navigate]
  );

  const handleNewChat = useCallback((): void => {
    setInitialMessage("");
    setIsSubmitting(false);
    isNavigatingRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string): void => {
    setInitialMessage(suggestion);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Mode card component with animations
  const ModeCard: React.FC<ModeCardProps> = ({
    title,
    description,
    colorClasses,
    icon,
    onClick,
    isActive,
    index,
  }) => (
    <motion.button
      onClick={onClick}
      className="text-left w-full focus:outline-none"
      variants={modeCardVariants}
      custom={index}
      whileHover="hover"
      whileTap="tap"
      layout
    >
      <motion.div
        className={`bg-white p-5 rounded-xl border transition-all duration-300 ${
          isActive
            ? `ring-2 ${colorClasses} shadow-lg border-transparent`
            : `border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md`
        }`}
        variants={activeCardVariants}
        animate={isActive ? "active" : "inactive"}
        layout
      >
        <div className="flex items-start gap-3">
          <motion.div
            className={`p-2 rounded-lg ${colorClasses
              .replace("ring-", "bg-")
              .replace("400", "100")}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {icon}
          </motion.div>
          <div className="flex-1">
            <motion.h3
              className={`font-semibold text-lg mb-1 ${colorClasses
                .replace("ring-", "text-")
                .replace("400", "600")}`}
              layout
            >
              {title}
            </motion.h3>
            <motion.p className="text-gray-600 text-sm leading-relaxed" layout>
              {description}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.button>
  );

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
                variants={logoVariants}
                whileHover="hover"
              >
                <Music className="h-8 w-8 text-white" />
              </motion.div>
              <motion.h1
                className="text-3xl font-bold text-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                BeatBuddy
              </motion.h1>
            </motion.div>

            {/* Welcome Message */}
            <motion.h2
              className="text-2xl md:text-4xl font-semibold text-center mb-4 text-gray-800"
              variants={itemVariants}
            >
              <motion.span
                className="text-indigo-600"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                ♪
              </motion.span>{" "}
              How can I help with your music today?
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
              variants={inputContainerVariants}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Textarea
                  ref={inputRef}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about song lyrics, identify tracks, or learn about music..."
                  className="min-h-24 resize-none text-lg mb-4 p-4 rounded-lg border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  rows={3}
                />
              </motion.div>

              {/* Suggestions */}
              <AnimatePresence mode="wait">
                {showSuggestions && (
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.p
                      className="text-sm text-gray-500 mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      Try asking:
                    </motion.p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions[currentMode].map(
                        (suggestion: string, index: number) => (
                          <motion.button
                            key={`${currentMode}-${index}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs py-1.5 px-2.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-200 leading-tight"
                            variants={suggestionVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            whileTap="tap"
                          >
                            {suggestion}
                          </motion.button>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="flex justify-between items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    size="sm"
                    variant="outline"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    {showSuggestions ? "Hide suggestions" : "Show suggestions"}
                  </Button>
                </motion.div>

                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
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
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Mode Selection Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
              variants={itemVariants}
              layout
            >
              <ModeCard
                mode="fun"
                title="Fun Mode"
                description="Just chat and have fun talking about music"
                colorClasses="ring-purple-400"
                icon={<Sparkles className="h-5 w-5 text-purple-500" />}
                onClick={() => handleModeSelect("fun")}
                isActive={currentMode === "fun"}
                index={0}
              />
              <ModeCard
                mode="mentor"
                title="Expert Mode"
                description="Chat with a music expert for detailed knowledge"
                colorClasses="ring-blue-400"
                icon={<Book className="h-5 w-5 text-blue-500" />}
                onClick={() => handleModeSelect("mentor")}
                isActive={currentMode === "mentor"}
                index={1}
              />
              <ModeCard
                mode="buddy"
                title="Buddy Mode"
                description="Talk with a music buddy who understands you"
                colorClasses="ring-green-400"
                icon={<Heart className="h-5 w-5 text-green-500" />}
                onClick={() => handleModeSelect("buddy")}
                isActive={currentMode === "buddy"}
                index={2}
              />
            </motion.div>

            {/* Recent Chats */}
            <motion.div className="w-full mt-8" variants={itemVariants} layout>
              <motion.h3
                className="font-medium text-gray-700 mb-3 flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <History className="h-4 w-4 mr-2" />
                Continue a recent conversation
              </motion.h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <AnimatePresence mode="wait">
                  {isLoadingHistory ? (
                    Array.from({ length: 3 }).map((_, index: number) => (
                      <motion.div
                        key={`skeleton-${index}`}
                        variants={skeletonVariants}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                      >
                        <Skeleton className="h-16 w-full rounded-lg bg-gray-200" />
                      </motion.div>
                    ))
                  ) : recentChatSessions.length > 0 ? (
                    recentChatSessions.map(
                      (session: SessionData, index: number) => (
                        <motion.button
                          key={session.id}
                          className="p-3 bg-white rounded-lg border border-gray-200 text-left hover:bg-gray-50 hover:border-indigo-200 transition-colors"
                          variants={chatSessionVariants}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => handleSessionSelect(session.id)}
                          layout
                        >
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {getShortText(session.title)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.formattedDate}
                          </p>
                        </motion.button>
                      )
                    )
                  ) : user ? (
                    <motion.div
                      className="col-span-3 text-center py-4 bg-white rounded-lg border border-gray-200"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      </motion.div>
                      <p className="text-sm text-gray-500">
                        No chat history yet
                      </p>
                      <p className="text-xs text-gray-400">
                        Start a new chat to see it here
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="col-span-3 text-center py-4 bg-white rounded-lg border border-gray-200"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        Sign in to see your chat history
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
