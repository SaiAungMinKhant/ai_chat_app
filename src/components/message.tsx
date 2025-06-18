import { motion } from "framer-motion";
import { Id } from "../../convex/_generated/dataModel";
import { SparklesIcon, AlertCircleIcon } from "lucide-react";
import { cx } from "class-variance-authority";
import { MarkdownRenderer } from "./markdown-renderer";

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content?: string;
  status?: "streaming" | "completed" | "error" | "stopped";
  model?: string;
}

interface MessageProps {
  message: Message;
  isStreaming?: boolean;
  hasError?: boolean;
  isStopped?: boolean;
  isLast?: boolean;
}

export function PreviewMessage({
  message,
  isStreaming,
  hasError,
  isStopped,
  isLast,
}: MessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      } ${isLast ? "mb-6" : ""}`}
    >
      <div
        className={`rounded-lg px-4 py-2 whitespace-pre-wrap max-w-full overflow-hidden ${
          message.role === "user" ? "bg-primary text-primary max-w-[80%]" : ""
        }`}
      >
        {message.content ? (
          <>
            <MarkdownRenderer>{message.content}</MarkdownRenderer>

            {/* Status indicators for assistant messages */}
            {message.role === "assistant" && (
              <div className="mt-2 flex items-center gap-2">
                {isStreaming && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span>Generating...</span>
                  </div>
                )}

                {hasError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircleIcon size={12} />
                    <span>Failed to generate response</span>
                  </div>
                )}

                {isStopped && (
                  <div className="flex items-center gap-1 text-xs text-orange-500">
                    <AlertCircleIcon size={12} />
                    <span>Generation stopped</span>
                  </div>
                )}

                {message.status === "completed" && message.model && (
                  <div className="text-xs text-muted-foreground">
                    {message.model}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="text-muted-foreground italic">
            {message.role === "assistant" && isStreaming && "Thinking..."}
            {message.role === "assistant" &&
              hasError &&
              "Error generating response"}
            {message.role === "assistant" && isStopped && "Generation stopped"}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function ThinkingMessage() {
  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Generating response...</span>
            </div>
          </div>
        </div>
      </div>
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
