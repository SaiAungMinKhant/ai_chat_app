import { motion } from "framer-motion";
import { Id } from "../../convex/_generated/dataModel";
import { SparklesIcon } from "lucide-react";
import { cx } from "class-variance-authority";
import { MarkdownRenderer } from "./markdown-renderer";

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content?: string;
}

interface MessageProps {
  message: Message;
  isLoading?: boolean;
  isLast?: boolean;
}

export function PreviewMessage({ message, isLoading, isLast }: MessageProps) {
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
        className={` rounded-lg px-4 py-2 whitespace-pre-wrap ${
          message.role === "user"
            ? "bg-primary-foreground text-primary max-w-[80%]"
            : ""
        }`}
      >
        {message.content ? (
          <MarkdownRenderer>{message.content}</MarkdownRenderer>
        ) : (
          <span className="text-muted-foreground italic">
            {message.role === "assistant" && isLoading ? "Thinking..." : ""}
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
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
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
            Hmm...
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
