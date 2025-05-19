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
  const setLoading = useState(false)[1];
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [initialMessageProcessed, setInitialMessageProcessed] = useState(false);
  const [initialGreetingShown, setInitialGreetingShown] = useState(false);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const isMountedRef = useRef(true);
  const lastSentMessageRef = useRef("");
  const apiCallAttemptsRef = useRef(0);

  // Generate a session ID for this chat
  const [sessionId, setSessionId] = useState<string>(propSessionId || uuidv4());
  const [userId] = useState<string>(() => {
    return user?.id || "anonymous";
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessionId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use TanStack Query mutations and queries
  const sendMessageMutation = useSendMessage();
  const { data: sessionDataFromQuery = [] } = useSessionData(
    propSessionId || sessionId
  );

  // Track component lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Process Google avatar URL with cache buster to avoid CORS issues
  useEffect(() => {
    if (user?.image) {
      if (user.image.includes("googleusercontent.com")) {
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

  // Reset state when sessionId changes
  useEffect(() => {
    if (propSessionId) {
      setSessionId(propSessionId);
      setSelectedSessionId(propSessionId);

      // Reset message processing state
      setInitialMessageProcessed(false);
      lastSentMessageRef.current = "";
      apiCallAttemptsRef.current = 0;
    }
  }, [propSessionId]);

  // Show initial greeting
  useEffect(() => {
    if (
      sessionData.length === 0 &&
      sessionDataFromQuery.length === 0 &&
      !initialGreetingShown &&
      messages.length === 0
    ) {
      const initialMessage: Message = {
        id: "initial",
        content:
          "🎵 **Hello there!** I'm BeatBuddy, your AI music assistant. Whether you need song recommendations, lyrics help, or music knowledge, I'm here to help. What's your musical question today?",
        sender: "bot",
        timestamp: new Date(),
        complete: true,
      };

      setMessages([initialMessage]);
      setInitialGreetingShown(true);
      setDisplayedContents((prev) => ({
        ...prev,
        [initialMessage.id]: initialMessage.content,
      }));
    }
  }, [
    sessionData.length,
    sessionDataFromQuery.length,
    initialGreetingShown,
    messages.length,
  ]);

  // Function to create a bot message with forced typing
  const createBotMessageWithTyping = (
    content: string,
    messageId: string = `bot-${Date.now()}`
  ) => {
    // Create bot message and explicitly mark as incomplete
    const botMessage: Message = {
      id: messageId,
      content: content,
      sender: "bot",
      timestamp: new Date(),
      complete: false, // Always start as false to enable typing effect
    };

    // Add the message to the messages array
    setMessages((prevMessages) => [...prevMessages, botMessage]);

    // Initialize the displayed content as an empty string
    setDisplayedContents((prev) => ({
      ...prev,
      [messageId]: "",
    }));

    return messageId;
  };

  // CRITICAL FIX: Direct handler for initial message with the improved approach
  useEffect(() => {
    const handleInitialMessage = async () => {
      if (
        isMountedRef.current &&
        initialUserMessage &&
        initialUserMessage.trim() !== "" &&
        !initialMessageProcessed &&
        !apiCallInProgress
      ) {
        // Mark as processed
        setInitialMessageProcessed(true);
        lastSentMessageRef.current = initialUserMessage;

        // First, add user message to chat
        const userMessageId = `initial-user-${Date.now()}`;
        const userMessage: Message = {
          id: userMessageId,
          content: initialUserMessage,
          sender: "user",
          timestamp: new Date(),
          complete: true,
        };

        setMessages((prev) => [...prev, userMessage]);

        // Then directly make API call
        try {
          setIsTyping(true);
          setApiCallInProgress(true);
          apiCallAttemptsRef.current += 1;

          const response = await sendMessageMutation.mutateAsync({
            question: initialUserMessage,
            mode: currentMode,
            session_id: selectedSessionId || sessionId,
            user_id: user?.id || userId,
          });

          if (isMountedRef.current) {
            // Use the helper function for consistent message creation
            createBotMessageWithTyping(
              response.response,
              `bot-direct-${Date.now()}`
            );
          }
        } catch (error) {
          if (isMountedRef.current) {
            // Add error message
            const errorMessageId = `error-direct-${Date.now()}`;
            const errorMessage: Message = {
              id: errorMessageId,
              content:
                "Sorry, I encountered an error processing your request. Please try again.",
              sender: "bot",
              timestamp: new Date(),
              complete: true,
            };

            setMessages((prev) => [...prev, errorMessage]);
            setDisplayedContents((prev) => ({
              ...prev,
              [errorMessageId]: errorMessage.content,
            }));
          }
        } finally {
          if (isMountedRef.current) {
            setIsTyping(false);
            setApiCallInProgress(false);
          }
        }
      }
    };

    // Execute handler when initial message changes
    handleInitialMessage();
  }, [
    initialUserMessage,
    currentMode,
    selectedSessionId,
    sessionId,
    user?.id,
    userId,
  ]);

  // Process session data
  useEffect(() => {
    if (
      (sessionDataFromQuery && sessionDataFromQuery.length > 0) ||
      (sessionData && sessionData.length > 0)
    ) {
      fetchSessionData(selectedSessionId || sessionId);
    }
  }, [sessionDataFromQuery, selectedSessionId, sessionId]);

  // Update mode if prop changes
  useEffect(() => {
    setCurrentMode(mode as BotMode);
  }, [mode]);

  // Function to process session data
  const fetchSessionData = async (_id: string) => {
    setLoading(true);

    try {
      const data = sessionData.length > 0 ? sessionData : sessionDataFromQuery;

      if (Array.isArray(data) && data.length > 0) {
        const sortedData = [...data].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const hasOngoingRequest = sortedData.some(
          (msg) => msg.query && (!msg.response || msg.response === "")
        );

        const latestMode = sortedData[sortedData.length - 1]?.mode;
        if (latestMode && ["fun", "mentor", "buddy"].includes(latestMode)) {
          setCurrentMode(latestMode as "fun" | "mentor" | "buddy");
        }

        const formattedMessages: Message[] = [];
        const newDisplayedContents: Record<string, string> = {};

        if (formattedMessages.length === 0) {
          const initialMessageId = "initial";
          const initialMessage = {
            id: initialMessageId,
            content:
              "🎵 **Hello there!** I'm BeatBuddy, your AI music assistant. Whether you need song recommendations, lyrics help, or music knowledge, I'm here to help. What's your musical question today?",
            sender: "bot" as const,
            timestamp: new Date(),
            complete: true,
          };
          formattedMessages.push(initialMessage);
          newDisplayedContents[initialMessageId] = initialMessage.content;
        }

        setInitialMessageProcessed(true);
        const processedQueries = new Set();

        sortedData.forEach((item, index) => {
          if (processedQueries.has(item.query)) {
            return;
          }
          processedQueries.add(item.query);

          const userMsgId = `history-user-${index}`;
          const userMsg = {
            id: userMsgId,
            content: item.query,
            sender: "user" as const,
            timestamp: new Date(item.created_at),
            complete: true,
          };
          formattedMessages.push(userMsg);

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

            // Make sure to set the full content for completed historical messages
            newDisplayedContents[botMsgId] = botMsg.content;
          }
        });

        setMessages(formattedMessages);
        setDisplayedContents(newDisplayedContents);

        if (hasOngoingRequest) {
          setIsTyping(true);
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToAPI = async (
    message: string,
    mode: BotMode,
    session: string,
    user_id: string
  ) => {
    if (apiCallInProgress) {
      return;
    }

    setIsTyping(true);
    setApiCallInProgress(true);
    apiCallAttemptsRef.current += 1;

    try {
      const response = await sendMessageMutation.mutateAsync({
        question: message,
        mode: mode,
        session_id: session,
        user_id: user_id,
      });

      if (isMountedRef.current) {
        // Use the new helper function to create a bot message with typing
        createBotMessageWithTyping(response.response);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const errorMessageId = `error-${Date.now()}`;
        const errorMessage: Message = {
          id: errorMessageId,
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
          sender: "bot",
          timestamp: new Date(),
          complete: true, // Error messages can be complete immediately
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);
        setDisplayedContents((prev) => ({
          ...prev,
          [errorMessageId]: errorMessage.content,
        }));
      }
    } finally {
      if (isMountedRef.current) {
        setIsTyping(false);
        setApiCallInProgress(false);
      }
    }
  };

  // Handle UI send message
  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || inputValue;
    if (messageToSend.trim() === "" || isTyping || apiCallInProgress) return;

    const messageId = `msg-${Date.now()}`;
    const userMessageId = `user-${messageId}`;

    // Check for duplicates
    const isDuplicate = messages.some(
      (msg) =>
        msg.sender === "user" &&
        msg.content === messageToSend &&
        Date.now() - msg.timestamp.getTime() < 5000
    );

    if (messageToSend === lastSentMessageRef.current || isDuplicate) {
      return;
    }

    lastSentMessageRef.current = messageToSend;

    // Add user message if not already shown
    if (
      !customMessage ||
      !messages.some(
        (msg) => msg.sender === "user" && msg.content === messageToSend
      )
    ) {
      const userMessage: Message = {
        id: userMessageId,
        content: messageToSend,
        sender: "user",
        timestamp: new Date(),
        complete: true,
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
    }

    // Clear input field
    if (!customMessage) setInputValue("");

    // Send to API
    sendMessageToAPI(
      messageToSend,
      currentMode,
      selectedSessionId || sessionId,
      user?.id || userId
    );
  };

  // REVISED: Improved typing effect that properly types until the end
  useEffect(() => {
    // Find all incomplete bot messages
    const incompleteMessages = messages.filter(
      (msg) => msg.sender === "bot" && msg.complete === false
    );

    // Process only one message at a time - the oldest incomplete message
    const incompleteMessage =
      incompleteMessages.length > 0
        ? incompleteMessages.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          )[0]
        : null;

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
        // Message is complete, mark it as such ONLY when typing is finished
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
      // Only send if not already in progress
      if (!isTyping && !apiCallInProgress) {
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
              disabled={isTyping || apiCallInProgress}
            />
            <Button
              onClick={() => handleSendMessage()}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isTyping || apiCallInProgress}
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
