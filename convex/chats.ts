import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendMessage = mutation({
  args: {
    content: v.string(),
    chatId: v.optional(v.id("chats")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let currentChatId = args.chatId;

    if (!currentChatId) {
      const chatTitle = args.content.substring(0, 100);
      currentChatId = await ctx.db.insert("chats", {
        userId,
        title: chatTitle,
        visibility: "private",
      });
    }

    await ctx.db.insert("messages", {
      chatId: currentChatId,
      role: "user",
      content: args.content,
    });

    await ctx.scheduler.runAfter(0, internal.gemini.chat, {
      chatId: currentChatId,
    });

    return currentChatId;
  },
});
