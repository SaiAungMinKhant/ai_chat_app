import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { VisibilityType } from "@/components/visibility-selector";
import type { Id } from "../../convex/_generated/dataModel";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  const [localVisibility, setLocalVisibility] = useState(initialVisibilityType);

  // Query chat from Convex
  const chat = useQuery(api.chats.get, {
    chatId: chatId as Id<"chats">,
  });

  // Mutation to update chat visibility
  const updateVisibility = useMutation(api.chats.updateVisibility);

  const visibilityType = useMemo(() => {
    return chat?.visibility || localVisibility;
  }, [chat?.visibility, localVisibility]);

  const setVisibilityType = async (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);

    try {
      await updateVisibility({
        chatId: chatId as Id<"chats">,
        visibility: updatedVisibilityType,
      });
    } catch (error) {
      console.error("Failed to update visibility:", error);
      // Revert local state on error
      setLocalVisibility(visibilityType);
    }
  };

  return { visibilityType, setVisibilityType };
}
