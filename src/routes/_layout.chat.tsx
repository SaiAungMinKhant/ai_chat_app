import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/_layout/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: chatId } = Route.useSearch();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const createChat = useMutation(api.chats.sendMessage);
  const sendMessage = useMutation(api.messages.send);

  const messages = useQuery(
    api.messages.list,
    chatId ? { chatId: chatId as Id<"chats"> } : "skip",
  );

  useEffect(() => {
    if (messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      if (chatId) {
        console.log("Continuing chat:", chatId);
        await sendMessage({
          chatId: chatId as Id<"chats">,
          content: message,
        });
      } else {
        console.log("Creating new chat with message:", message);
        const newChatId = await createChat({ content: message });
        console.log("Created chat with ID:", newChatId);
        await navigate({
          to: "/chat",
          search: { id: newChatId },
        });
      }

      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {chatId && messages ? (
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content || (
                    <span className="text-muted-foreground italic">
                      {msg.role === "assistant" ? "Thinking..." : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Empty state - no chat selected
          <div className="flex flex-col justify-center items-center h-full p-4 md:p-8">
            <div className="space-y-2 w-full text-center max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight">
                What can I help you with today?
              </h2>
            </div>
          </div>
        )}
      </div>

      {/* Form Area - Always Present */}
      <div className="bg-background p-4 md:p-8 border-t">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="relative w-full"
          >
            <TextareaAutosize
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                chatId ? "Type your message..." : "Start a new chat..."
              }
              minRows={chatId ? 1 : 5}
              maxRows={15}
              className="w-full resize-none rounded-lg border bg-background px-4 py-3 pr-12 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
