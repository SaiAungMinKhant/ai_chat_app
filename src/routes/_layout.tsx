import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();

  const user = useQuery(api.auth.isAuthenticated);
  console.log("Current user:", user);
  // Redirect root path to /chat
  if (location.pathname === "/") {
    return <Navigate to="/chat" search={{ id: undefined }} replace />;
  }
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar variant="sidebar" />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
