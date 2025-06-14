import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "@/components/chat";

export const Route = createFileRoute("/_layout/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: chatId } = Route.useSearch();
  return <Chat chatId={chatId} />;
}
