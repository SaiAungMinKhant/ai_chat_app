import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "../components/theme-provider";
import { SignOutButton } from "../components/auth/sign-out-button";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <header className="sticky top-0 z-10 p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold">AI Chat App</h1>
        <SignOutButton />
      </header>
      <main className="container mx-auto p-8 flex flex-col gap-8">
        <Outlet />
      </main>
    </ThemeProvider>
  ),
});
