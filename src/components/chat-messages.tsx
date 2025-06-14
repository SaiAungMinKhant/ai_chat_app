import { memo } from "react";
import { motion } from "framer-motion";
import equal from "fast-deep-equal";
import { Id } from "../../convex/_generated/dataModel";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { Greeting } from "./message";

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content?: string;
}

interface ChatMessagesProps {
  chatId: string;
  messages?: Message[];
  isLoading?: boolean;
}

function PureChatMessages({ messages, isLoading = false }: ChatMessagesProps) {
  const { containerRef, endRef, onViewportEnter, onViewportLeave } =
    useScrollToBottom();

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {/* Show greeting when no messages */}
      {(!messages || messages.length === 0) && <Greeting />}

      {/* Messages */}
      <div className="flex flex-col w-full max-w-3xl mx-auto px-4 space-y-4">
        {messages?.map((msg, index) => (
          <motion.div
            key={msg._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap  ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.content || (
                <span className="text-muted-foreground italic">
                  {msg.role === "assistant" ? "Thinking..." : ""}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Thinking indicator for when assistant is processing */}
      {isLoading &&
        messages &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start px-4"
          >
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </div>
          </motion.div>
        )}

      {/* Scroll anchor */}
      <motion.div
        ref={endRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const ChatMessages = memo(PureChatMessages, (prevProps, nextProps) => {
  // Skip re-render if messages haven't changed
  if (prevProps.messages?.length !== nextProps.messages?.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.chatId !== nextProps.chatId) return false;

  return true;
});
