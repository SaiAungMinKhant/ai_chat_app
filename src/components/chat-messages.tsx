import { memo, RefObject } from "react";
import equal from "fast-deep-equal";
import { Id } from "../../convex/_generated/dataModel";
import { Greeting, PreviewMessage, ThinkingMessage } from "./message";

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content?: string;
  status?: "streaming" | "completed" | "error" | "stopped";
  model?: string;
}

interface ChatMessagesProps {
  chatId: string;
  messages?: Message[];
  containerRef: RefObject<HTMLDivElement | null>;
  endRef: RefObject<HTMLDivElement | null>;
}

function PureChatMessages({
  messages,
  containerRef,
  endRef,
}: ChatMessagesProps) {
  const reversedMessages = messages ? [...messages].reverse() : [];

  const getMessageStatus = () => {
    if (!messages?.length) return null;

    const lastMessage = messages[messages.length - 1];
    return {
      status: lastMessage.status,
      isStreaming: lastMessage.status === "streaming",
      hasError: lastMessage.status === "error",
      isCompleted: lastMessage.status === "completed",
      isStopped: lastMessage.status === "stopped",
      isAssistant: lastMessage.role === "assistant",
      isUser: lastMessage.role === "user",
    };
  };

  const messageStatus = getMessageStatus();

  const shouldShowThinkingMessage =
    messageStatus?.isUser && !messageStatus?.isCompleted;

  // const shouldShowStreamingIndicator = messageStatus?.isStreaming;

  const shouldShowErrorIndicator = messageStatus?.hasError;

  const shouldShowStoppedIndicator = messageStatus?.isStopped;

  return (
    <div
      ref={containerRef}
      className="flex flex-col-reverse h-full min-w-0 gap-6 overflow-y-scroll pt-20 pb-24 relative"
    >
      <div ref={endRef} className="h-4 w-full flex-shrink-0" />

      <div className="flex flex-col-reverse w-full max-w-3xl mx-auto px-4 space-y-4 space-y-reverse pb-4">
        {shouldShowThinkingMessage && <ThinkingMessage />}

        {shouldShowErrorIndicator && (
          <div className="flex items-center gap-2 text-sm text-red-500 px-4 py-2 bg-red-50 rounded-lg">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Failed to generate response. Please try again.</span>
          </div>
        )}

        {shouldShowStoppedIndicator && (
          <div className="flex items-center gap-2 text-sm text-orange-500 px-4 py-2 bg-orange-50 rounded-lg">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>Response generation was stopped.</span>
          </div>
        )}

        {reversedMessages.map((msg, index) => {
          const isLast = index === reversedMessages.length - 1;
          const isStreaming = msg.status === "streaming";
          const hasError = msg.status === "error";
          const isStopped = msg.status === "stopped";

          return (
            <PreviewMessage
              key={msg._id}
              message={msg}
              isStreaming={isStreaming}
              hasError={hasError}
              isStopped={isStopped}
              isLast={isLast}
            />
          );
        })}
      </div>

      {(!messages || messages.length === 0) && <Greeting />}
    </div>
  );
}

export const ChatMessages = memo(PureChatMessages, (prevProps, nextProps) => {
  if (prevProps.messages?.length !== nextProps.messages?.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (prevProps.chatId !== nextProps.chatId) return false;
  return true;
});
