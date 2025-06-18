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

    // Get the chat to verify ownership or public access
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Allow access if user owns the chat or if chat is public
    if (chat.visibility === "public" || (userId && chat.userId === userId)) {
      return await ctx.db
        .query("messages")
        .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
        .collect();
    }

    throw new Error("Chat not found or unauthorized");
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
      status: "completed",
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
      "deepseek/deepseek-chat-v3-0324:free",
      "openai/gpt-4.1-nano",
      "anthropic/claude-3-haiku",
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
      status: "completed",
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

export const internalGet = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

export const internalCreate = internalMutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("streaming"),
        v.literal("completed"),
        v.literal("error"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      model: args.model,
      content: args.content,
      status: args.status,
    });
    return messageId;
  },
});

export const internalUpdate = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("streaming"),
        v.literal("completed"),
        v.literal("error"),
        v.literal("stopped"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const updateData: any = {};
    if (args.content !== undefined) {
      updateData.content = args.content;
    }
    if (args.status !== undefined) {
      updateData.status = args.status;
    }
    await ctx.db.patch(args.messageId, updateData);
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

export const retryGeneration = mutation({
  args: {
    chatId: v.id("chats"),
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

    // Find the last assistant message with error status
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .collect();

    const lastErrorMessage = messages.find(
      (msg) => msg.role === "assistant" && msg.status === "error",
    );

    if (!lastErrorMessage) {
      throw new Error("No failed message found to retry");
    }

    // Delete the failed message
    await ctx.db.delete(lastErrorMessage._id);

    // Re-trigger the AI response with the same model
    await ctx.scheduler.runAfter(0, internal.openrouter.chatStream, {
      chatId: args.chatId,
      modelName: lastErrorMessage.model || "openai/gpt-4.1-nano",
    });
  },
});

export const stopGeneration = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .collect();

    const streamingMessage = messages.find(
      (msg) => msg.role === "assistant" && msg.status === "streaming",
    );

    if (streamingMessage) {
      await ctx.db.patch(streamingMessage._id, {
        status: "stopped",
      });

      return { success: true, messageId: streamingMessage._id };
    }

    const lastAssistantMessage = messages.find(
      (msg) =>
        msg.role === "assistant" &&
        msg.status !== "completed" &&
        msg.status !== "stopped",
    );

    if (lastAssistantMessage) {
      await ctx.db.patch(lastAssistantMessage._id, {
        status: "stopped",
      });

      return { success: true, messageId: lastAssistantMessage._id };
    }

    return {
      success: true,
      messageId: null,
      message: "No active message to stop",
    };
  },
});

export const listPublic = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.visibility !== "public") {
      throw new Error("Public chat not found");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});
