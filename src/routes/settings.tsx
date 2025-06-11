import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: () => <SettingsPage />,
});

function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <p>Settings content will go here.</p>
        </div>
      </div>
    </div>
  );
}
