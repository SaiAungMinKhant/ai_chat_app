import { memo, RefObject } from "react";
import equal from "fast-deep-equal";
import {
  type ChatMessage,
  Greeting,
  PreviewMessage,
  TypingIndicator,
} from "./message";

interface ChatMessagesProps {
  chatId: string;
  messages?: ChatMessage[];
  containerRef: RefObject<HTMLDivElement | null>;
  endRef: RefObject<HTMLDivElement | null>;
  onSuggestionClick: (prompt: string) => void;
}

function PureChatMessages({
  chatId,
  messages,
  containerRef,
  endRef,
  onSuggestionClick,
}: ChatMessagesProps) {
  const reversedMessages = messages ? [...messages].reverse() : [];
  const isWaitingForReply = messages?.[messages.length - 1]?.role === "user";
  const isEmptyChat = chatId ? messages?.length === 0 : true;

  return (
    <div
      ref={containerRef}
      className="flex flex-col-reverse h-full min-w-0 gap-6 overflow-y-scroll pt-14 pb-40 relative"
    >
      <div ref={endRef} className="h-4 w-full flex-shrink-0" />

      <div className="flex flex-col-reverse w-full max-w-3xl mx-auto px-4 gap-6 pb-4">
        {isWaitingForReply && <TypingIndicator />}

        {reversedMessages.map((msg) => (
          <PreviewMessage key={msg._id} message={msg} />
        ))}
      </div>

      {isEmptyChat && <Greeting onSuggestionClick={onSuggestionClick} />}
    </div>
  );
}

export const ChatMessages = memo(PureChatMessages, (prevProps, nextProps) => {
  if (prevProps.messages?.length !== nextProps.messages?.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (prevProps.onSuggestionClick !== nextProps.onSuggestionClick) return false;
  return true;
});
