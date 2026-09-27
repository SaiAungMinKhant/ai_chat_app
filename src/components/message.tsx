import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircleIcon } from "lucide-react";
import { Doc } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";

export type ChatMessage = Doc<"messages">;

type MessageStatusValue = NonNullable<ChatMessage["status"]>;

const STATUS_INDICATORS: Record<
  MessageStatusValue,
  (message: ChatMessage) => ReactNode
> = {
  streaming: (message) => (message.content ? null : <TypingIndicator />),
  completed: (message) =>
    message.model ? (
      <p className="text-xs text-muted-foreground">{message.model}</p>
    ) : null,
  error: () => (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircleIcon className="size-4" />
      Failed to generate response
    </p>
  ),
  stopped: () => (
    <p className="text-sm text-muted-foreground">Generation stopped</p>
  ),
};

function MessageStatus({ message }: { message: ChatMessage }) {
  return message.status ? STATUS_INDICATORS[message.status](message) : null;
}

export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="Assistant is typing"
      className="flex h-6 items-center gap-1"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export function PreviewMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full min-w-0",
        isUser ? "justify-end" : "flex-col gap-2",
      )}
    >
      {isUser ? (
        <div className="bg-muted text-foreground rounded-2xl px-4 py-2.5 max-w-[85%] md:max-w-[75%] whitespace-pre-wrap break-words">
          {message.content}
        </div>
      ) : (
        <>
          {message.content && (
            <MarkdownRenderer>{message.content}</MarkdownRenderer>
          )}
          <MessageStatus message={message} />
        </>
      )}
    </motion.div>
  );
}

export function Greeting() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center space-y-4"
    >
      <h2 className="text-2xl font-semibold text-muted-foreground">
        Start a conversation
      </h2>
      <p className="text-muted-foreground">Send a message to begin chatting</p>
    </motion.div>
  );
}
