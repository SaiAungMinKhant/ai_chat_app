import { memo, useRef, useCallback, useState } from "react"; // useState is needed now for dialog
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Square, LayoutTemplate } from "lucide-react"; // Import LayoutTemplate icon
import { toast } from "sonner";
import { useWindowSize } from "usehooks-ts";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { PreviewAttachment } from "./preview-attachment";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog, // Import Dialog components
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TemplateSelector } from "./template-selector"; // Import your TemplateSelector component
// Make sure the path is correct based on where template-selector.tsx is relative to ChatInput.tsx
// e.g., if template-selector is in components/templates/, then "../../components/templates/template-selector"
// Or, if it's in the same directory: "./template-selector"

// interface Attachment {
//   url: string;
//   name: string;
//   contentType: string;
// }

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content?: string;
  status?: "streaming" | "completed" | "error" | "stopped";
  model?: string;
}

interface ChatInputProps {
  chatId?: string;
  input: string;
  setInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  onStop?: () => void;
  className?: string;
  showSuggestions?: boolean;
  chatMessages?: Message[];
  canScrollUp: boolean;
  scrollToTop: () => void;
  scrollTop: number;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

function PureChatInput({
  input,
  setInput,
  onSubmit,
  isLoading = false,
  className,
  chatMessages,
  chatId,
  canScrollUp,
  scrollToTop,
  selectedModel = "openai/gpt-4.1-nano",
  onModelChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const { width } = useWindowSize();
  const navigate = useNavigate();
  const user = useQuery(api.auth.isAuthenticated);
  const stopGeneration = useMutation(api.messages.stopGeneration);

  // const [attachments, setAttachments] = useState<Attachment[]>([]);
  // const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  // State to manage the TemplateSelector dialog
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Check if there's a streaming message
  const isStreaming = chatMessages?.some(
    (msg) => msg.role === "assistant" && msg.status === "streaming",
  );

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToTop();
  };

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, []);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  }, []);

  // Handle input changes
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setInput(newValue);
    adjustHeight();
  };

  // File upload functionality
  // const uploadFile = async (file: File): Promise<Attachment | undefined> => { /* ... */ };
  // const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ }, []);

  // Callback to handle selection from TemplateSelector
  const handleTemplateSelect = useCallback(
    (content: string) => {
      setInput(content);
      setIsTemplateDialogOpen(false);
    },
    [setInput /*, adjustHeight*/],
  );

  // Submit form
  const submitForm = useCallback(
    async (e?: React.FormEvent | React.MouseEvent) => {
      e?.preventDefault();

      if (!input.trim() || isLoading) return;
      if (!user) {
        await navigate({ to: "/sign-in" });
        return;
      }

      const formEvent = e as React.FormEvent;
      onSubmit(formEvent);

      // Reset form
      // setAttachments([]); // If attachments are used, uncomment
      resetHeight();

      if (width && width > 768) {
        textareaRef.current?.focus();
      }
    },
    [input, isLoading, onSubmit, resetHeight, width, user, navigate],
  );

  const handleStopGeneration = () => {
    if (!chatId) return;

    void stopGeneration({ chatId: chatId as Id<"chats"> })
      .then((result) => {
        if (result.success) {
          // Successfully stopped generation
        }
      })
      .catch((error) => {
        console.error("Failed to stop generation:", error);
        if (!error.message?.includes("No streaming message found")) {
          toast.error("Failed to stop generation");
        }
      });
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {canScrollUp && chatMessages && chatMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              className="rounded-full bg-background border shadow-lg hover:bg-accent"
              size="icon"
              variant="outline"
              onClick={handleScrollToTop}
              type="button"
            >
              <ArrowDown size={16} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested actions */}
      {/* {showSuggestions && (
        <SuggestedActions
          onSuggestionClick={(suggestion) => setInput(suggestion)}
          chatId={chatId}
        />
      )} */}

      {/* File input (commented out) */}
      {/* <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={(e) => void handleFileChange(e)}
        tabIndex={-1}
      /> */}

      {/* Attachments preview (commented out) */}
      {/* {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment
              key={attachment.url}
              attachment={attachment}
              onRemove={() =>
                setAttachments((prev) =>
                  prev.filter((a) => a.url !== attachment.url),
                )
              }
            />
          ))}
          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{ url: "", name: filename, contentType: "" }}
              isUploading={true}
            />
          ))}
        </div>
      )} */}

      {/* Main input form */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={chatId ? "Type your message..." : "Start a new chat..."}
          value={input}
          onChange={handleInput}
          className={`min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-3xl !text-base border pb-10 pr-20 ${className || ""}`}
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

        {/* Left side buttons - Model selector, Templates, and Attachment */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {/* Model Selector */}
          {onModelChange && (
            <Select
              value={selectedModel}
              onValueChange={onModelChange}
              disabled={isLoading}
            >
              <SelectTrigger className="px-2 py-1 h-8 text-xs rounded-full min-w-[125px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="openai/gpt-4.1-nano">
                  GPT-4.1 Nano
                </SelectItem>
                <SelectItem value="google/gemini-2.0-flash-001">
                  Gemini 2.0 Flash
                </SelectItem>
                <SelectItem value="deepseek/deepseek-chat-v3-0324:free">
                  DeepSeek v3
                </SelectItem>
                <SelectItem value="anthropic/claude-3-haiku">
                  Claude 3 Haiku
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Template Selector Button */}
          <Dialog
            open={isTemplateDialogOpen}
            onOpenChange={setIsTemplateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                disabled={isLoading}
              >
                <LayoutTemplate size={16} /> {/* Use the template icon */}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6">
              {" "}
              {/* Adjust size for content */}
              <h2 className="text-xl font-bold mb-4">
                Select or Manage Templates
              </h2>
              <div className="flex-grow overflow-y-auto">
                {" "}
                {/* Enable scrolling for template content */}
                <TemplateSelector
                  onTemplateSelect={handleTemplateSelect}
                  className="h-full"
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Attachment button (still commented out) */}
          {/* <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip size={16} />
          </Button> */}
        </div>

        {/* Submit/Stop button */}
        <div className="absolute bottom-2 right-2">
          {isStreaming ? (
            <Button
              type="button"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={handleStopGeneration}
              variant="destructive"
            >
              <Square size={14} />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              disabled={!input.trim()} // Still relying on this as attachments are off
              onClick={(e) => void submitForm(e)}
            >
              <ArrowUp size={14} />
            </Button>
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
  if (prevProps.scrollTop !== nextProps.scrollTop) return false;
  if (prevProps.chatMessages?.length !== nextProps.chatMessages?.length)
    return false;
  if (prevProps.selectedModel !== nextProps.selectedModel) return false;

  // Check if any message status has changed (important for streaming/stopped states)
  if (prevProps.chatMessages && nextProps.chatMessages) {
    for (let i = 0; i < prevProps.chatMessages.length; i++) {
      const prevMsg = prevProps.chatMessages[i];
      const nextMsg = nextProps.chatMessages[i];
      if (prevMsg.status !== nextMsg.status) {
        return false;
      }
    }
  }

  return true;
});
