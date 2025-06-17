import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the chat to verify ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});

export const send = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user owns this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: "user",
      model: "user",
      content: args.content,
    });

    // Schedule the AI response generation
    await ctx.scheduler.runAfter(0, internal.gemini.chatStream, {
      chatId: args.chatId,
    });
  },
});

export const sendWithOpenRouter = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    modelName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user owns this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    // Validate model name against allowed values
    const allowedModels = [
      "google/gemini-2.0-flash-001",
      "deepseek/deepseek-prover-v2:free",
      "openai/gpt-4.1-nano",
      "anthropic/claude-3-haiku",
      "user",
    ] as const;

    if (!allowedModels.includes(args.modelName as any)) {
      throw new Error(
        `Invalid model name: ${args.modelName}. Allowed models: ${allowedModels.join(", ")}`,
      );
    }

    await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: "user",
      model: args.modelName,
      content: args.content,
    });

    // Schedule the OpenRouter AI response generation
    await ctx.scheduler.runAfter(0, internal.openrouter.chatStream, {
      chatId: args.chatId,
      modelName: args.modelName,
    });
  },
});

export const internalList = internalQuery({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

export const internalCreate = internalMutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      model: args.model,
      content: args.content,
    });
    return messageId;
  },
});

export const internalUpdate = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { content: args.content });
  },
});

export const update = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.messageId, { content: args.content });
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
