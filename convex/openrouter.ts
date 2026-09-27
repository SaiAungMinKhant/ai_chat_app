import { ActionCtx, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { smoothStream, streamText, generateText } from "ai";

const defaultApiKey = process.env.OPENROUTER_API_KEY;
if (!defaultApiKey) {
  throw new Error("OPENROUTER_API_KEY environment variable is required");
}

const STREAM_FLUSH_INTERVAL_MS = 150;

// Scheduled actions carry no auth identity, so the user is passed explicitly.
async function openRouterFor(ctx: ActionCtx, userId: Id<"users">) {
  const encryptedApiKey = await ctx.runQuery(
    internal.myFunctions.getEncryptedApiKey,
    { userId },
  );
  const apiKey = encryptedApiKey
    ? await ctx.runAction(internal.encryptionActions.decryptText, {
        encryptedText: encryptedApiKey,
      })
    : defaultApiKey;
  return createOpenRouter({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL,
  });
}

export const chatStream = internalAction({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    modelName: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.runQuery(internal.messages.internalList, {
      chatId: args.chatId,
    });

    const assistantMessageId = await ctx.runMutation(
      internal.messages.internalCreate,
      {
        chatId: args.chatId,
        role: "assistant",
        content: "",
        model: args.modelName,
        status: "streaming",
      },
    );

    try {
      const openrouter = await openRouterFor(ctx, args.userId);

      const { textStream } = streamText({
        model: openrouter(args.modelName),
        messages: messages
          .filter((message) => message.status !== "error" && message.content)
          .map((message) => ({ role: message.role, content: message.content })),
        experimental_transform: smoothStream({
          delayInMs: 10,
          chunking: "word",
        }),
      });

      let content = "";
      let lastFlush = Date.now();
      let stopped = false;

      for await (const part of textStream) {
        content += part;
        if (Date.now() - lastFlush < STREAM_FLUSH_INTERVAL_MS) continue;
        lastFlush = Date.now();

        const streaming = await ctx.runMutation(internal.messages.writeStream, {
          messageId: assistantMessageId,
          content,
          done: false,
        });
        if (!streaming) {
          stopped = true;
          break;
        }
      }

      if (!stopped) {
        await ctx.runMutation(internal.messages.writeStream, {
          messageId: assistantMessageId,
          content,
          done: true,
        });
      }

      // Only generate title after the first AI response (2 messages total)
      if (messages.length === 2) {
        await ctx.runAction(internal.openrouter.generateTitle, {
          chatId: args.chatId,
          userId: args.userId,
        });
      }
    } catch (error) {
      console.error("Error in OpenRouter chat stream:", error);
      await ctx.runMutation(internal.messages.internalUpdate, {
        messageId: assistantMessageId,
        content: "Error: Could not get a response from the AI.",
        status: "error",
      });
      throw error;
    }
  },
});

export const generateTitle = internalAction({
  args: { chatId: v.id("chats"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.runQuery(internal.messages.internalList, {
      chatId: args.chatId,
    });

    const conversationForTitle = messages
      .slice(0, 2)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    const openrouter = await openRouterFor(ctx, args.userId);

    const { text: title } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      prompt: `Based on the following conversation, create a short, concise title (5 words or less). Do not use quotation marks or any other formatting.

      Conversation:
      ${conversationForTitle}

      Title:`,
    });

    await ctx.runMutation(internal.chats.updateTitle, {
      chatId: args.chatId,
      title: title.trim(),
    });
  },
});
