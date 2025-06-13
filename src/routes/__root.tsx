import {
  createRootRoute,
  Outlet,
  useLocation,
  Navigate,
} from "@tanstack/react-router";
import { ThemeProvider } from "../components/theme-provider";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: LayoutComponent,
});

function LayoutComponent() {
  const location = useLocation();
  if (location.pathname === "/") {
    return <Navigate to="/chat" search={{ id: undefined }} replace />;
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  );
}
