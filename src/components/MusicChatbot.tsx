import React, { useState, useRef, useEffect } from "react";
import { Send, Music, BookOpen, Users } from "lucide-react";

import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../lib/auth";
import { useSendMessage, useSessionData } from "../hooks/api/use-chat-api";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

// Define the different bot modes
type BotMode = "fun" | "mentor" | "buddy";

// Define message structure
interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  complete?: boolean;
}

// Chat history message from API
interface ChatHistoryMessage {
  id: number;
  user_id: string;
  session_id: string;
  query: string;
  response: string;
  mode: string;
  intent: string;
  created_at: string;
}

interface MusicChatbotProps {
  initialUserMessage?: string;
  mode?: "fun" | "mentor" | "buddy";
  sessionId?: string;
  sessionData?: ChatHistoryMessage[];
}

const MusicChatbot: React.FC<MusicChatbotProps> = ({
  initialUserMessage = "",
  mode = "fun",
  sessionId: propSessionId,
  sessionData = [],
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentMode, setCurrentMode] = useState<BotMode>(mode);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedContents, setDisplayedContents] = useState<
    Record<string, string>
  >({});
  // Fix 1: Only keep the setter function for loading
  const setLoading = useState(false)[1];
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Add a flag to track which messages have been sent to the API
  const [processedMessages, setProcessedMessages] = useState<
    Record<string, boolean>
  >({});

  // Generate a session ID for this chat
  const [sessionId, setSessionId] = useState<string>(propSessionId || uuidv4());

  const [userId] = useState<string>(() => {
    return user?.id || "anonymous";
  });

  // Chat history state
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessionId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use TanStack Query mutations and queries
  const sendMessageMutation = useSendMessage();
  // Fix 2: Remove the unused loadingSession variable
  const { data: sessionDataFromQuery = [] } = useSessionData(
    propSessionId || sessionId
  );

  // Process Google avatar URL with cache buster to avoid CORS issues
  useEffect(() => {
    if (user?.image) {
      // For Google URLs, handle them differently due to Chrome CORS caching issues
      if (user.image.includes("googleusercontent.com")) {
        // Add a cache-busting parameter to force Chrome to make a new request
        const cacheBuster = `?not-from-cache-please=${Date.now()}`;
        const googleImageUrl = `${user.image}${cacheBuster}`;
        setImageUrl(googleImageUrl);
      } else {
        setImageUrl(user.image);
      }
    } else {
      setImageUrl(null);
    }
  }, [user]);

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${
        nameParts[nameParts.length - 1][0]
      }`.toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  // Handle image error
  const handleImageError = () => {
    console.error("Failed to load image:", imageUrl);
    setImageError(true);
  };

  // Process sessionData if provided
  useEffect(() => {
    if (sessionDataFromQuery && sessionDataFromQuery.length > 0) {
      fetchSessionData(selectedSessionId || sessionId);
    }
  }, [sessionDataFromQuery, selectedSessionId, sessionId]);

  // Handle initial message properly
  useEffect(() => {
    // Only set initial greeting if no sessionData was provided
    if (sessionData.length === 0 && !sessionDataFromQuery.length) {
      const initialMessage: Message = {
        id: "initial",
        content:
          "👋 Hi there! I'm your music companion. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
        complete: true, // Initial greeting is always complete
      };

      setMessages([initialMessage]);

      // Initialize displayed content for initial message
      setDisplayedContents((prev) => ({
        ...prev,
        [initialMessage.id]: initialMessage.content,
      }));
    }

    // Check if there's an initial message to process
    if (initialUserMessage && initialUserMessage.trim() !== "") {
      // First, always show the user's message
      const userMessageId = `initial-user-${Date.now()}`;
      const userMessage: Message = {
        id: userMessageId,
        content: initialUserMessage,
        sender: "user",
        timestamp: new Date(),
        complete: true, // User messages are always complete
      };

      // Always display the user message
      setMessages((prevMessages) => [...prevMessages, userMessage]);

      // Use a slight delay to make it feel more natural
      const timer = setTimeout(() => {
        // Only process this message if it hasn't been sent to the API yet
        if (!processedMessages[userMessageId]) {
          // Mark as processed immediately
          setProcessedMessages((prev) => ({
            ...prev,
            [userMessageId]: true,
          }));

          // Then fetch and process API response
          handleSendMessage(initialUserMessage);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [initialUserMessage, sessionData.length, sessionDataFromQuery.length]);

  // Update sessionId if prop changes
  useEffect(() => {
    if (propSessionId) {
      setSessionId(propSessionId);
      setSelectedSessionId(propSessionId);
    }
  }, [propSessionId]);

  // Update mode if prop changes
  useEffect(() => {
    setCurrentMode(mode as BotMode);
  }, [mode]);

  // Function to process session data
  const fetchSessionData = async (id: string) => {
    setLoading(true);

    try {
      console.log("Processing session data for ID:", id);

      const data = sessionDataFromQuery;
      console.log("Session data:", data);

      if (Array.isArray(data) && data.length > 0) {
        // Sort by created_at to get the chronological order
        const sortedData = [...data].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Check if there's an ongoing request (query without response)
        const hasOngoingRequest = sortedData.some(
          (msg) => msg.query && (!msg.response || msg.response === "")
        );

        // Set current mode from the most recent message
        const latestMode = sortedData[sortedData.length - 1]?.mode;
        if (latestMode && ["fun", "mentor", "buddy"].includes(latestMode)) {
          setCurrentMode(latestMode as "fun" | "mentor" | "buddy");
        }

        // Process and format messages for display
        const formattedMessages: Message[] = [];
        const newDisplayedContents: Record<string, string> = {};

        // Add initial greeting message
        const initialMessageId = "initial";
        const initialMessage = {
          id: initialMessageId,
          content:
            "👋 Hi there! I'm your music companion. How can I help you today?",
          sender: "bot" as const,
          timestamp: new Date(),
          complete: true,
        };
        formattedMessages.push(initialMessage);
        newDisplayedContents[initialMessageId] = initialMessage.content;

        sortedData.forEach((item, index) => {
          // Add user message (query)
          const userMsgId = `history-user-${index}`;
          const userMsg = {
            id: userMsgId,
            content: item.query,
            sender: "user" as const,
            timestamp: new Date(item.created_at),
            complete: true,
          };
          formattedMessages.push(userMsg);

          // Add bot message (response) if it exists and is not empty
          if (item.response && item.response.trim() !== "") {
            const botMsgId = `history-bot-${index}`;
            const botMsg = {
              id: botMsgId,
              content: item.response,
              sender: "bot" as const,
              timestamp: new Date(item.created_at),
              complete: true,
            };
            formattedMessages.push(botMsg);
            newDisplayedContents[botMsgId] = botMsg.content;
          }
          // If there's no response, we don't add any processing message
          // The loading indicator will be shown if isTyping is true
        });

        setMessages(formattedMessages);
        setDisplayedContents(newDisplayedContents);

        // If there's an ongoing request, set typing to true to show the loading dots
        if (hasOngoingRequest) {
          setIsTyping(true);
        }
      }
    } catch (error) {
      console.error("Error processing session data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle send message with TanStack Query
  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || inputValue;
    if (messageToSend.trim() === "" || isTyping) return;

    const messageId = `msg-${Date.now()}`;
    const userMessageId = `user-${messageId}`;

    // Add user message
    const userMessage: Message = {
      id: userMessageId,
      content: messageToSend,
      sender: "user",
      timestamp: new Date(),
      complete: true,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    if (!customMessage) setInputValue("");

    // Check if already processed
    if (processedMessages[userMessageId]) {
      console.warn("This message was already processed, skipping API call");
      return;
    }

    setProcessedMessages((prev) => ({ ...prev, [userMessageId]: true }));
    setIsTyping(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        question: messageToSend,
        mode: currentMode,
        session_id: selectedSessionId || sessionId,
        user_id: user?.id || userId,
      });

      const botMessageId = `bot-${messageId}`;
      const botMessage: Message = {
        id: botMessageId,
        content: response.response,
        sender: "bot",
        timestamp: new Date(),
        complete: false, // Start with typing effect
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setDisplayedContents((prev) => ({
        ...prev,
        [botMessageId]: "",
      }));
    } catch (error) {
      console.error("Error in chat flow:", error);

      // Add error message
      const errorMessageId = `error-${messageId}`;
      const errorMessage: Message = {
        id: errorMessageId,
        content:
          "Sorry, I encountered an error while processing your request. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        complete: true,
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      setDisplayedContents((prev) => ({
        ...prev,
        [errorMessageId]: errorMessage.content,
      }));
    } finally {
      setIsTyping(false);
    }
  };

  // Typing effect useEffect
  useEffect(() => {
    // Find the latest bot message that isn't complete
    const incompleteMessage = messages.find(
      (msg) => msg.sender === "bot" && !msg.complete
    );

    if (incompleteMessage) {
      // Get the current displayed content or initialize it
      const currentContent = displayedContents[incompleteMessage.id] || "";

      // If we haven't displayed the full message yet
      if (currentContent.length < incompleteMessage.content.length) {
        // Set a timeout to add the next character
        const timer = setTimeout(() => {
          // Add the next character
          const nextChar = incompleteMessage.content[currentContent.length];
          const newContent = currentContent + nextChar;

          // Update the displayed content for this message
          setDisplayedContents((prev) => ({
            ...prev,
            [incompleteMessage.id]: newContent,
          }));
        }, 15); // Adjust typing speed (milliseconds per character)

        return () => clearTimeout(timer);
      } else {
        // Message is complete, mark it as such
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === incompleteMessage.id ? { ...msg, complete: true } : msg
          )
        );
      }
    }
  }, [messages, displayedContents]);

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedContents]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle pressing Enter to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Only send if not already typing
      if (!isTyping) {
        handleSendMessage();
      }
    }
  };

  // Get icon based on mode
  const getModeIcon = (mode: BotMode) => {
    switch (mode) {
      case "fun":
        return <Music className="h-5 w-5" />;
      case "mentor":
        return <BookOpen className="h-5 w-5" />;
      case "buddy":
        return <Users className="h-5 w-5" />;
    }
  };

  // Check if we should show the image or fallback
  const shouldShowFallback = imageError || !imageUrl;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Fixed at top */}
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getModeIcon(currentMode)}
              <div>
                <h2 className="font-semibold">Music Assistant</h2>
                <p className="text-sm text-gray-500">
                  <Badge
                    variant="outline"
                    className={`mr-1 ${
                      currentMode === "fun"
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200"
                        : currentMode === "mentor"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                    }`}
                  >
                    {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}{" "}
                    Mode
                  </Badge>
                  Active now
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages - ScrollArea takes remaining height */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4 pb-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex gap-2 max-w-[80%]">
                  {message.sender === "bot" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        <Music className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <Card
                    className={`py-2 px-3 break-words ${
                      message.sender === "user"
                        ? "bg-indigo-600 text-white"
                        : ""
                    }`}
                  >
                    <div className="whitespace-normal overflow-hidden text-wrap">
                      {message.sender === "bot" ? (
                        <ReactMarkdown
                          components={{
                            // Basic text formatting - no changes needed
                            strong: ({ node, ...props }) => (
                              <strong className="font-bold" {...props} />
                            ),
                            em: ({ node, ...props }) => (
                              <em className="italic" {...props} />
                            ),

                            // Paragraphs
                            p: ({ node, ...props }) => (
                              <p className="mb-2" {...props} />
                            ),

                            // Headings with NO spacing
                            h1: ({ node, ...props }) => (
                              <h1
                                className="text-lg font-bold m-0"
                                {...props}
                              />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2
                                className="text-base font-bold m-0"
                                {...props}
                              />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3 className="font-bold m-0" {...props} />
                            ),

                            // Lists with NO spacing
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc pl-6 m-0" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol
                                className="list-decimal pl-6 m-0"
                                {...props}
                              />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="m-0 p-0" {...props} />
                            ),

                            // Code formatting with NO spacing
                            code: ({ node, className, children, ...props }) => {
                              const isInline =
                                !className || !className.includes("language-");

                              if (isInline) {
                                return (
                                  <code
                                    className="bg-gray-100 px-1 py-0 rounded text-xs font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <pre className="bg-gray-100 p-1 rounded-md m-0 overflow-x-auto">
                                  <code
                                    className="text-xs font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                </pre>
                              );
                            },

                            // Blockquote with NO spacing
                            blockquote: ({ node, ...props }) => (
                              <blockquote
                                className="border-l-2 border-gray-300 pl-2 italic m-0"
                                {...props}
                              />
                            ),

                            // Links with minimal styling - no spacing changes needed
                            a: ({ node, ...props }) => (
                              <a
                                className="text-blue-600 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              />
                            ),

                            // Table formatting with NO spacing
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto m-0">
                                <table
                                  className="min-w-full border-collapse text-sm"
                                  {...props}
                                />
                              </div>
                            ),
                            thead: ({ node, ...props }) => (
                              <thead className="bg-gray-100" {...props} />
                            ),
                            tbody: ({ node, ...props }) => <tbody {...props} />,
                            tr: ({ node, ...props }) => (
                              <tr
                                className="border-b border-gray-200"
                                {...props}
                              />
                            ),
                            th: ({ node, ...props }) => (
                              <th
                                className="px-1 py-0 text-left font-semibold"
                                {...props}
                              />
                            ),
                            td: ({ node, ...props }) => (
                              <td className="px-1 py-0" {...props} />
                            ),

                            // Horizontal rule with NO spacing
                            hr: ({ node, ...props }) => (
                              <hr className="m-0 border-gray-200" {...props} />
                            ),
                          }}
                        >
                          {message.complete
                            ? message.content
                            : displayedContents[message.id] || ""}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-indigo-200"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </Card>

                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {!shouldShowFallback ? (
                        <AvatarImage
                          src={imageUrl}
                          alt={user?.name || "User"}
                          onError={handleImageError}
                          crossOrigin="anonymous"
                        />
                      ) : null}
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">
                      <Music className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="py-2 px-3">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: "0s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area - Fixed at bottom */}
        <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0 z-10">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about music, theory, or get recommendations..."
              className="min-h-12 resize-none"
              rows={1}
            />
            <Button
              onClick={() => handleSendMessage()}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Current Mode:{" "}
            {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} -
            {currentMode === "fun" &&
              " Get fun facts and light conversation about music"}
            {currentMode === "mentor" &&
              " Receive technical advice and learning resources"}
            {currentMode === "buddy" &&
              " Get encouragement and support for your musical journey"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicChatbot;
