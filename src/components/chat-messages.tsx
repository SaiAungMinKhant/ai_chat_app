import { memo, RefObject } from "react";
import equal from "fast-deep-equal";
import { Id } from "../../convex/_generated/dataModel";
import { Greeting, PreviewMessage, ThinkingMessage } from "./message";

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content?: string;
}

interface ChatMessagesProps {
  chatId: string;
  messages?: Message[];
  isLoading?: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  endRef: RefObject<HTMLDivElement | null>;
}

function PureChatMessages({
  messages,
  isLoading = false,
  containerRef,
  endRef,
}: ChatMessagesProps) {
  const reversedMessages = messages ? [...messages].reverse() : [];

  return (
    <div
      ref={containerRef}
      className="flex flex-col-reverse min-w-0 gap-6 flex-1 overflow-y-auto pt-4 relative"
      style={{ height: "calc(100vh - 200px)" }}
    >
      <div ref={endRef} className="h-4 w-full flex-shrink-0" />

      <div className="flex flex-col-reverse w-full max-w-3xl mx-auto px-4 space-y-4 space-y-reverse pb-4">
        {isLoading &&
          messages &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && <ThinkingMessage />}

        {reversedMessages.map((msg, index) => (
          <PreviewMessage
            key={msg._id}
            message={msg}
            isLoading={isLoading}
            isLast={index === reversedMessages.length - 1}
          />
        ))}
      </div>

      {(!messages || messages.length === 0) && <Greeting />}
    </div>
  );
}

export const ChatMessages = memo(PureChatMessages, (prevProps, nextProps) => {
  if (prevProps.messages?.length !== nextProps.messages?.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.chatId !== nextProps.chatId) return false;
  return true;
});
