import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";

interface Chat {
  _id: Id<"chats">;
  id: string;
  title?: string;
  visibility: "public" | "private";
  createdAt: string;
  userId: string;
}

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <SidebarMenuItem className="pb-1 group/chat-item">
      <SidebarMenuButton asChild isActive={isActive}>
        <div className="flex flex-row gap-2 items-center justify-between">
          <Link
            to="/chat"
            search={{ id: chat._id }}
            onClick={() => setOpenMobile(false)}
            className="flex-1 min-w-0"
          >
            <span className="block truncate">{chat.title}</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover/chat-item:opacity-100 transition-all duration-200 h-7 w-7 p-0 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(chat._id);
            }}
          >
            <Trash2
              size={10}
              className="transition-transform group-hover/chat-item:scale-110"
            />
          </Button>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export const ChatItem = PureChatItem;
