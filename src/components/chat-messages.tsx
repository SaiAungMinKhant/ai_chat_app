import { memo, RefObject } from "react";
import { motion } from "framer-motion";
import equal from "fast-deep-equal";
import { Id } from "../../convex/_generated/dataModel";
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
          messages[messages.length - 1].role === "user" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
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

        {reversedMessages.map((msg, index) => (
          <motion.div
            key={msg._id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
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
