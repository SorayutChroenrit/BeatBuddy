import { ChevronDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../lib/auth";

const UserDropdown = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  // Get initials for avatar
  const getInitials = () => {
    if (!user.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${
        nameParts[nameParts.length - 1][0]
      }`.toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  // Extract first and last name for display
  const getUserName = () => {
    return user.name || "User";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-2 rounded-md w-full transition-colors hover:bg-gray-50">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-indigo-100 text-indigo-700">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow text-left">
            <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getUserName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm">Personal Account</p>
              </div>
              <div className="ml-auto">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 cursor-pointer focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
