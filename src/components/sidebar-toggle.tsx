import type { ComponentProps } from "react";
import { PanelLeft } from "lucide-react";
import { type SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="ghost"
          className={`p-2 rounded-full ${className || ""}`}
          aria-label="Toggle Sidebar"
          size="icon"
        >
          <PanelLeft size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
