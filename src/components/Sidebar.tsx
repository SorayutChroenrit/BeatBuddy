import React, { useMemo } from "react";
import {
  Music,
  PlusCircle,
  MessageSquare,
  BookOpen,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useChatHistory } from "../hooks/api/use-chat-api";
import { useAuth } from "../lib/auth";
import UserDropdown from "./UserDropdown";

// Define chat session for sidebar
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageDate: Date;
  mode: string;
}

interface SidebarProps {
  currentMode?: "fun" | "mentor" | "buddy";
  onModeChange?: (mode: "fun" | "mentor" | "buddy") => void;
  selectedSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewChat?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentMode = "fun",
  onModeChange,
  selectedSessionId,
  onSessionSelect,
  onNewChat,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use TanStack Query instead of manual fetching
  const { data: chatHistoryData = [], isLoading: isLoadingHistory } =
    useChatHistory(user?.id || "");

  // Helper function to format session title from date
  const formatSessionTitle = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Process chat history data into sessions using useMemo for optimization
  const chatSessions = useMemo(() => {
    if (!chatHistoryData.length) return [];

    const sessionsMap = new Map<string, ChatSession>();

    chatHistoryData.forEach((msg) => {
      if (!sessionsMap.has(msg.session_id)) {
        const sessionDate = new Date(msg.created_at);
        const title = formatSessionTitle(sessionDate);

        sessionsMap.set(msg.session_id, {
          id: msg.session_id,
          title: title,
          lastMessage: msg.query,
          lastMessageDate: sessionDate,
          mode: msg.mode,
        });
      } else {
        const existingSession = sessionsMap.get(msg.session_id)!;
        const msgDate = new Date(msg.created_at);

        if (msgDate > existingSession.lastMessageDate) {
          existingSession.lastMessage = msg.query;
          existingSession.lastMessageDate = msgDate;
          existingSession.mode = msg.mode;
          sessionsMap.set(msg.session_id, existingSession);
        }
      }
    });

    return Array.from(sessionsMap.values()).sort(
      (a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
    );
  }, [chatHistoryData]);

  // Get abbreviated chat text for sidebar
  const getShortText = (text: string, maxLength: number = 25): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Handle mode change
  const handleModeChange = (mode: "fun" | "mentor" | "buddy") => {
    if (onModeChange) {
      onModeChange(mode);
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
    navigate("/");
  };

  // Handle session selection
  const handleSessionSelect = (sessionId: string) => {
    console.log("Session selected:", sessionId);
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    } else {
      console.log("Navigating to:", `/chat/${sessionId}`);
      navigate(`/chat/${sessionId}`);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto flex-shrink-0 flex flex-col">
      {/* Main Content Area */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Header with Logo Only */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-800">Beat Buddy</h1>
          </div>
        </div>

        {/* Main Sidebar Content */}
        <div className="flex flex-col space-y-6 flex-grow">
          <Button
            variant="default"
            className="w-full justify-start mb-4 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleNewChat}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chat
          </Button>

          {/* Chat Mode Selection */}
          <div>
            <h2 className="text-sm font-semibold mb-2 text-gray-700">
              Chat Modes
            </h2>
            <div className="space-y-3">
              {/* Fun Mode Button */}
              <Button
                variant="outline"
                className={`w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-100 ${
                  currentMode === "fun"
                    ? "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                    : ""
                }`}
                onClick={() => handleModeChange("fun")}
              >
                <Music className="mr-2 h-4 w-4" />
                Fun Mode
              </Button>

              {/* Mentor Mode Button */}
              <Button
                variant="outline"
                className={`w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-100 ${
                  currentMode === "mentor"
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    : ""
                }`}
                onClick={() => handleModeChange("mentor")}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Expert Mode
              </Button>

              {/* Buddy Mode Button */}
              <Button
                variant="outline"
                className={`w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-100 ${
                  currentMode === "buddy"
                    ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                    : ""
                }`}
                onClick={() => handleModeChange("buddy")}
              >
                <Users className="mr-2 h-4 w-4" />
                Buddy Mode
              </Button>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-grow mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                Chat History
              </h2>
            </div>

            {isLoadingHistory ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-md bg-gray-100" />
                <Skeleton className="h-12 w-full rounded-md bg-gray-100" />
                <Skeleton className="h-12 w-full rounded-md bg-gray-100" />
              </div>
            ) : chatSessions && chatSessions.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-460px)] pr-3">
                <div className="space-y-2">
                  {chatSessions.map((session) => (
                    <Button
                      key={session.id}
                      variant={
                        selectedSessionId === session.id ? "secondary" : "ghost"
                      }
                      className={`w-full justify-start h-auto py-2 text-left text-gray-700 ${
                        selectedSessionId === session.id
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSessionSelect(session.id)}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">
                            {session.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {getShortText(session.lastMessage)}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : user ? (
              <div className="text-center text-sm text-gray-500 py-4">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No chat history yet</p>
                <p className="text-xs">Start chatting to save conversations</p>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-4">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Sign in to see your chat history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Dropdown at Bottom */}
      {user && (
        <div className="border-t border-gray-200 mt-auto">
          <UserDropdown />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
