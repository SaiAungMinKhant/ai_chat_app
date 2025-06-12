import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Creating chat with prompt:", args.prompt);

    const userId = await getAuthUserId(ctx);
    console.log("User ID:", userId);

    if (userId === null) {
      throw new Error("Client is not authenticated!");
    }
    const user = await ctx.db.get(userId);
    console.log("User:", user);

    const chatTitle = args.prompt.substring(0, 100);

    const chatId = await ctx.db.insert("chats", {
      userId,
      title: chatTitle,
    });
    console.log("Inserted chat with ID:", chatId);

    const messageId = await ctx.db.insert("messages", {
      chatId,
      role: "user",
      content: args.prompt,
    });
    console.log("Inserted message with ID:", messageId);

    try {
      await ctx.runMutation(internal.gemini.chat, {
        chatId,
      });
      console.log("Called gemini.chat successfully");
    } catch (error) {
      console.error("Error calling gemini.chat:", error);
    }

    return chatId;
  },
});

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
