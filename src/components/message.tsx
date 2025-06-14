import { motion } from "framer-motion";
import { Id } from "../../convex/_generated/dataModel";

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
        className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {message.content || (
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="bg-muted rounded-lg px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span className="text-sm text-muted-foreground">Thinking...</span>
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
      <p className="text-muted-foreground">
        Send a message to begin chatting
      </p>
    </motion.div>
  );
}