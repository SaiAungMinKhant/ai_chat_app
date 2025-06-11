import { Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SignOutButton } from "./auth/sign-out-button";
import { useConvexAuth } from "convex/react";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";

export function AppSidebar({ ...props }) {
  const { isAuthenticated } = useConvexAuth();
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarTrigger />
          <SidebarGroupContent>
            <SidebarMenu>
              {/* {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))} */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isAuthenticated ? (
          <SignOutButton />
        ) : (
          <Link to="/sign-in">
            <Button variant="default">Sign in</Button>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
