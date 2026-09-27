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

const SUGGESTIONS = [
  {
    title: "Explain a concept",
    prompt: "Explain how neural networks learn, in simple terms.",
  },
  {
    title: "Write some code",
    prompt: "Write a TypeScript function that debounces another function.",
  },
  {
    title: "Summarize text",
    prompt: "Summarize the following text in three bullet points:\n\n",
  },
  {
    title: "Brainstorm ideas",
    prompt: "Brainstorm ten names for a study-planner app.",
  },
] as const;

export function Greeting({
  onSuggestionClick,
}: {
  onSuggestionClick: (prompt: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col items-center justify-center gap-8 w-full max-w-2xl mx-auto px-4"
    >
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground text-center">
        How can I help you today?
      </h1>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.title}
            type="button"
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="rounded-xl border bg-card hover:bg-accent text-left px-4 py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="text-sm font-medium">{suggestion.title}</div>
            <div className="text-sm text-muted-foreground truncate">
              {suggestion.prompt}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
