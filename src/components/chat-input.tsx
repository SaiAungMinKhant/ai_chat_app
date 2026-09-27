import { memo, useRef, useCallback, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Square, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { useWindowSize } from "usehooks-ts";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TemplateSelector } from "./template-selector";
import type { ChatMessage } from "./message";

const MODELS = [
  { id: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano" },
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek v3" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
] as const;

interface ChatInputProps {
  chatId?: string;
  input: string;
  setInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  chatMessages?: ChatMessage[];
  canScrollUp: boolean;
  scrollToTop: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

function PureChatInput({
  input,
  setInput,
  onSubmit,
  isLoading = false,
  chatMessages,
  chatId,
  canScrollUp,
  scrollToTop,
  selectedModel = "openai/gpt-4.1-nano",
  onModelChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const navigate = useNavigate();
  const user = useQuery(api.auth.isAuthenticated);
  const stopGeneration = useMutation(api.messages.stopGeneration);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const isStreaming = chatMessages?.some(
    (msg) => msg.role === "assistant" && msg.status === "streaming",
  );

  // Input also changes from outside the textarea (templates, suggestions,
  // clearing after submit), so size it from the value rather than onChange.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  const handleTemplateSelect = useCallback(
    (content: string) => {
      setInput(content);
      setIsTemplateDialogOpen(false);
    },
    [setInput],
  );

  const submitForm = useCallback(
    async (e?: React.FormEvent | React.MouseEvent) => {
      e?.preventDefault();

      if (!input.trim() || isLoading) return;
      if (!user) {
        await navigate({ to: "/sign-in" });
        return;
      }

      onSubmit(e as React.FormEvent);

      if (width && width > 768) {
        textareaRef.current?.focus();
      }
    },
    [input, isLoading, onSubmit, width, user, navigate],
  );

  const handleStopGeneration = () => {
    if (!chatId) return;

    void stopGeneration({ chatId: chatId as Id<"chats"> }).catch(
      (error: Error) => {
        console.error("Failed to stop generation:", error);
        if (!error.message?.includes("No streaming message found")) {
          toast.error("Failed to stop generation");
        }
      },
    );
  };

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {canScrollUp && chatMessages && chatMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              className="rounded-full bg-background shadow-lg hover:bg-accent"
              size="icon"
              variant="outline"
              aria-label="Scroll to latest message"
              onClick={(e) => {
                e.preventDefault();
                scrollToTop();
              }}
              type="button"
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-3xl border bg-card shadow-sm transition focus-within:ring-2 focus-within:ring-ring/30">
        <textarea
          ref={textareaRef}
          aria-label="Message"
          placeholder={chatId ? "Type your message..." : "Start a new chat..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="block w-full min-h-[64px] max-h-[40dvh] overflow-y-auto resize-none bg-transparent px-4 pt-4 pb-2 text-base outline-none placeholder:text-muted-foreground"
          rows={2}
          autoFocus
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (isLoading) {
                toast.error("Please wait for the response to finish!");
              } else {
                void submitForm(e);
              }
            }
          }}
        />

        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-1">
            {onModelChange && (
              <Select
                value={selectedModel}
                onValueChange={onModelChange}
                disabled={isLoading}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Model"
                  className="h-8 rounded-full border-0 bg-transparent dark:bg-transparent hover:bg-accent dark:hover:bg-accent text-xs gap-1 px-3 shadow-none"
                >
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Dialog
              open={isTemplateDialogOpen}
              onOpenChange={setIsTemplateDialogOpen}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full text-muted-foreground"
                      aria-label="Templates"
                      disabled={isLoading}
                    >
                      <LayoutTemplate />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Templates</TooltipContent>
              </Tooltip>
              <DialogContent
                aria-describedby={undefined}
                className="sm:max-w-4xl h-[80vh] flex flex-col"
              >
                <DialogHeader>
                  <DialogTitle>Select or manage templates</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto">
                  <TemplateSelector
                    onTemplateSelect={handleTemplateSelect}
                    className="h-full"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isStreaming ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="size-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  aria-label="Stop generating"
                  onClick={handleStopGeneration}
                >
                  <Square className="size-3 fill-current" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop generating</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Send message"
                  disabled={!input.trim()}
                  onClick={(e) => void submitForm(e)}
                >
                  <ArrowUp />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

export const ChatInput = memo(PureChatInput, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (prevProps.canScrollUp !== nextProps.canScrollUp) return false;
  if (prevProps.chatMessages?.length !== nextProps.chatMessages?.length)
    return false;
  if (prevProps.selectedModel !== nextProps.selectedModel) return false;

  if (prevProps.chatMessages && nextProps.chatMessages) {
    for (let i = 0; i < prevProps.chatMessages.length; i++) {
      if (prevProps.chatMessages[i].status !== nextProps.chatMessages[i].status)
        return false;
    }
  }

  return true;
});
