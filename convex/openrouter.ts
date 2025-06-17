import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { smoothStream, streamText } from "ai";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY environment variable is required");
}

const openrouter = createOpenRouter({ apiKey });

export const chatStream = internalAction({
  args: {
    chatId: v.id("chats"),
    onUpdate: v.optional(v.any()),
    modelName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Starting OpenRouter chat stream for chatId:", args.chatId);

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
      },
    );

    try {
      const { textStream } = streamText({
        model: openrouter(args.modelName),
        prompt: messages.map((message) => message.content).join("\n"),
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

        // Update message in database
        await ctx.runMutation(internal.messages.internalUpdate, {
          messageId: assistantMessageId,
          content,
        });

        // Call update callback if provided
        if (args.onUpdate) {
          args.onUpdate(part);
        }
      }

      return { content, chunks };
    } catch (error) {
      console.error("Error in OpenRouter chat stream:", error);
      await ctx.runMutation(internal.messages.internalUpdate, {
        messageId: assistantMessageId,
        content: "Error: Could not get a response from the AI.",
      });
      throw error;
    }
  },
});
