import { useNavigate } from "@tanstack/react-router";
import { useWindowSize } from "usehooks-ts";
import { memo } from "react";

import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { PlusIcon } from "lucide-react";
import {
  type VisibilityType,
  VisibilitySelector,
} from "@/components/visibility-selector";

type User = {
  _id: string;
  name?: string;
  email?: string;
};

function PureChatHeader({
  chatId,
  selectedVisibilityType,
}: {
  chatId: string | undefined;
  selectedVisibilityType: VisibilityType;
  user: User | null;
}) {
  const navigate = useNavigate();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  const handleNewChat = () => {
    void navigate({ to: "/chat", search: { id: "" } });
  };

  return (
    // z-10 is to make sure toggle button to be able use
    <header className="flex sticky top-0 py-1.5 justify-between items-center px-2 md:px-2 gap-2 z-10">
      <div className="flex items-center gap-2">
        <SidebarToggle />

        {(!open || windowWidth < 768) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="order-2 md:order-1 p-2 rounded-full"
                onClick={handleNewChat}
              >
                <PlusIcon />
                <span className="md:sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        )}
      </div>

      {chatId && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
