import { useRef, useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

interface ChatProps {
  chatId?: string;
}

export function Chat({ chatId }: ChatProps) {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4.1-nano");
  const navigate = useNavigate();

  const createChat = useMutation(api.chats.sendMessage);
  const sendMessage = useMutation(api.messages.sendWithOpenRouter);

  const messages = useQuery(
    api.messages.list,
    chatId ? { chatId: chatId as Id<"chats"> } : "skip",
  );

  const {
    containerRef,
    endRef,
    scrollTop,
    canScrollUp,
    scrollToTop,
    scrollToNewMessage,
    checkScrollPosition,
  } = useScrollToBottom();

  const prevMessagesLength = useRef(messages?.length || 0);
  const prevLastMessage = useRef<string | null>(null);

  useEffect(() => {
    if (!messages?.length) return;

    const currentLength = messages.length;
    const lastMessage = messages[messages.length - 1];
    const isNewMessage = currentLength > prevMessagesLength.current;
    const isNewLastMessage = lastMessage?._id !== prevLastMessage.current;

    if (isNewMessage && isNewLastMessage) {
      if (lastMessage?.role === "user") {
        scrollToNewMessage();
      } else {
        setTimeout(() => {
          checkScrollPosition();
        }, 100);
      }
    }

    prevMessagesLength.current = currentLength;
    prevLastMessage.current = lastMessage?._id || null;
  }, [messages, scrollToNewMessage, checkScrollPosition]);

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => {
        checkScrollPosition();
      }, 100);
    }
  }, [messages?.length, checkScrollPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      if (chatId) {
        await sendMessage({
          chatId: chatId as Id<"chats">,
          content: message,
          modelName: selectedModel,
        });
      } else {
        const newChatId = await createChat({
          content: message,
          model: selectedModel,
        });
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
    <div className="flex flex-col h-screen bg-background relative">
      <ChatMessages
        chatId={chatId as string}
        messages={messages}
        containerRef={containerRef}
        endRef={endRef}
        onSuggestionClick={setMessage}
      />

      <div className="absolute top-0 left-0 right-0 z-20">
        <ChatHeader
          chatId={chatId}
          selectedVisibilityType="private"
          user={null}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <form className="flex mx-auto px-4 py-4 md:py-6 gap-2 w-full md:max-w-3xl">
          <ChatInput
            input={message}
            setInput={setMessage}
            onSubmit={(e) => void handleSubmit(e)}
            chatId={chatId}
            chatMessages={messages}
            canScrollUp={canScrollUp}
            scrollToTop={scrollToTop}
            scrollTop={scrollTop}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </form>
      </div>
    </div>
  );
}
