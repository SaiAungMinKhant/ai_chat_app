import { memo, useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Paperclip, Square } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PreviewAttachment } from "./preview-attachment";

interface Attachment {
  url: string;
  name: string;
  contentType: string;
}

interface ChatInputProps {
  chatId?: string;
  input: string;
  setInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading?: boolean;
  onStop?: () => void;
  className?: string;
  showSuggestions?: boolean;
  chatMessages?: { _id: string; role: string; content?: string }[];
  canScrollUp: boolean;
  scrollToTop: () => void;
  scrollTop: number;
}

function PureChatInput({
  input,
  setInput,
  onSubmit,
  isLoading = false,
  onStop,
  className,
  chatMessages,
  chatId,
  canScrollUp,
  scrollToTop,
  scrollTop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { width } = useWindowSize();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    `input-${chatId || "new"}`,
    "",
  );

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Scroll button clicked, current scrollTop:", scrollTop);
    scrollToTop();
  };

  console.log("ChatInput render:", {
    canScrollUp,
    scrollTop,
    messagesLength: chatMessages?.length,
  });

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

  // Initialize from localStorage
  useEffect(() => {
    if (textareaRef.current && !input) {
      const finalValue = localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
  }, [localStorageInput, setInput, input, adjustHeight]);

  // Save to localStorage
  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  // Handle input changes
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setInput(newValue);
    setLocalStorageInput(newValue);
    adjustHeight();
  };

  // File upload functionality
  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Replace with your file upload endpoint
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          name: data.pathname,
          contentType: data.contentType,
        };
      }

      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
      console.error("Failed to upload file:", error);
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfulAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => attachment !== undefined,
        );

        setAttachments((current) => [...current, ...successfulAttachments]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [],
  );

  // Submit form
  const submitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!input.trim() || isLoading) return;

      await onSubmit(e);

      // Reset form
      setAttachments([]);
      setLocalStorageInput("");
      resetHeight();

      if (width && width > 768) {
        textareaRef.current?.focus();
      }
    },
    [input, isLoading, onSubmit, setLocalStorageInput, resetHeight, width],
  );

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

      {/* File input */}
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={(e) => void handleFileChange(e)}
        tabIndex={-1}
      />

      {/* Attachments preview */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
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
      )}

      {/* Main input form */}

      <Textarea
        ref={textareaRef}
        placeholder={chatId ? "Type your message..." : "Start a new chat..."}
        value={input}
        onChange={handleInput}
        className={`min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 pr-20 ${className || ""}`}
        rows={2}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (isLoading) {
              toast.error("Please wait for the response to finish!");
            } else {
              void submitForm(e);
            }
          }
        }}
      />

      {/* Attachment button */}
      <div className="absolute bottom-2 left-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Paperclip size={16} />
        </Button>
      </div>

      {/* Submit/Stop button */}
      <div className="absolute bottom-2 right-2">
        {isLoading ? (
          <Button
            type="button"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={onStop}
            variant="outline"
          >
            <Square size={14} />
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={!input.trim() || uploadQueue.length > 0}
          >
            <ArrowUp size={14} />
          </Button>
        )}
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
  return true;
});
