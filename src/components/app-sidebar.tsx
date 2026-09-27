import { MessageSquare, PlusIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { SidebarHistory } from "./sidebar-history";
import { Id } from "../../convex/_generated/dataModel";
import { SidebarUser } from "./sidebar-user";

interface User {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  image?: string;
  email?: string;
  emailVerificationTime?: number;
  phone?: string;
  phoneVerificationTime?: number;
  isAnonymous?: boolean;
}

export function AppSidebar({ ...props }) {
  const user = useQuery(api.myFunctions.getCurrentUser) as User | null;
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex flex-row justify-between items-center">
          <Link
            to="/chat"
            search={{ id: "" }}
            onClick={() => {
              setOpenMobile(false);
            }}
            className="flex flex-row gap-2 items-center rounded-md px-1 py-1"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MessageSquare className="size-4" />
            </span>
            <span className="font-semibold">One Chat</span>
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label="New chat"
                onClick={() => {
                  setOpenMobile(false);
                  void navigate({ to: "/chat", search: { id: "" } });
                }}
              >
                <PlusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end">New chat</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <SidebarUser user={user} />
        ) : (
          <SidebarMenu>
            <Link to="/sign-in">
              <Button variant="default" className="w-full">
                Sign in
              </Button>
            </Link>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
