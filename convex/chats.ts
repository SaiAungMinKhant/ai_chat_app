import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendMessage = mutation({
  args: {
    content: v.string(),
    chatId: v.optional(v.id("chats")),
    model: v.optional(v.string()),
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

    const model = args.model || "openai/gpt-4.1-nano";

    await ctx.db.insert("messages", {
      chatId: currentChatId,
      role: "user",
      content: args.content,
      model: model,
    });

    await ctx.scheduler.runAfter(0, internal.openrouter.chatStream, {
      chatId: currentChatId,
      modelName: model,
    });

    return currentChatId;
  },
});

export const get = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    return chat;
  },
});

export const updateVisibility = mutation({
  args: {
    chatId: v.id("chats"),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, { visibility: args.visibility });
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { chats: [], hasMore: false };
    }

    const limit = args.limit || 20;

    let query = ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc");

    if (args.cursor) {
      query = query.filter((q) =>
        q.lt(q.field("_creationTime"), parseInt(args.cursor as string)),
      );
    }

    const chats = await query.take(limit + 1);
    const hasMore = chats.length > limit;

    if (hasMore) {
      chats.pop();
    }

    return {
      chats: chats.map((chat) => ({
        ...chat,
        id: chat._id,
        createdAt: new Date(chat._creationTime).toISOString(),
      })),
      hasMore,
    };
  },
});

export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});
