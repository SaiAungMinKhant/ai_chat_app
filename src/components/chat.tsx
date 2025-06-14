import { useRef, useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

interface ChatProps {
  chatId?: string;
}

export function Chat({ chatId }: ChatProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId={chatId as string}
        selectedModelId="gemini"
        selectedVisibilityType="private"
        isReadonly={false}
        user={null}
      />

      <ChatMessages
        chatId={chatId as string}
        messages={messages}
        isLoading={isLoading}
      />
      <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        <ChatInput
          message={message}
          setMessage={setMessage}
          onSubmit={handleSubmit}
          chatId={chatId}
          isLoading={isLoading}
          messages={messages}
        />
      </form>
    </div>
  );
}
