import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { smoothStream, streamText, generateText } from "ai";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const defaultApiKey = process.env.OPENROUTER_API_KEY;
if (!defaultApiKey) {
  throw new Error("OPENROUTER_API_KEY environment variable is required");
}

// Helper function to get the appropriate API key
async function getApiKey(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return defaultApiKey;
  }

  const user = await ctx.runQuery(api.myFunctions.getCurrentUser);
  return user?.openRouterApiKey || defaultApiKey;
}

export const chatStream = internalAction({
  args: {
    chatId: v.id("chats"),
    onUpdate: v.optional(v.any()),
    modelName: v.string(),
    stopSequences: v.optional(v.array(v.string())),
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
      // Get the appropriate API key
      const apiKey = await getApiKey(ctx);
      const openrouter = createOpenRouter({ apiKey });

      const { textStream } = streamText({
        model: openrouter(args.modelName),
        prompt: messages.map((message) => message.content).join("\n"),
        stopSequences: args.stopSequences || [],
        experimental_transform: smoothStream({
          delayInMs: 10,
          chunking: "word",
        }),
      });

      let content = "";
      const chunks: string[] = [];

      for await (const part of textStream) {
        content += part;
        chunks.push(part);

        const currentMessage = await ctx.runQuery(
          internal.messages.internalGet,
          {
            messageId: assistantMessageId,
          },
        );

        if (currentMessage?.status === "stopped") {
          break;
        }

        await ctx.runMutation(internal.messages.internalUpdate, {
          messageId: assistantMessageId,
          content,
        });

        if (args.onUpdate) {
          args.onUpdate(part);
        }
      }

      const finalMessage = await ctx.runQuery(internal.messages.internalGet, {
        messageId: assistantMessageId,
      });

      if (finalMessage?.status !== "stopped") {
        await ctx.runMutation(internal.messages.internalUpdate, {
          messageId: assistantMessageId,
          status: "completed",
        });
      }

      // Only generate title after the first AI response (2 messages total)
      if (messages.length === 2) {
        await ctx.runAction(internal.openrouter.generateTitle, {
          chatId: args.chatId,
        });
      }

      return { content, chunks };
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
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const messages = await ctx.runQuery(internal.messages.internalList, {
      chatId: args.chatId,
    });

    const conversationForTitle = messages
      .slice(0, 2)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    // Get the appropriate API key
    const apiKey = await getApiKey(ctx);
    const openrouter = createOpenRouter({ apiKey });

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
