import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { smoothStream, streamText } from "ai";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_API_KEY environment variable is required");
}

const genAI = createGoogleGenerativeAI({ apiKey });
const model = genAI("gemini-1.5-flash");

export const chatStream = internalAction({
  args: {
    chatId: v.id("chats"),
    onUpdate: v.optional(v.any()), // Callback for streaming updates
  },
  handler: async (ctx, args) => {
    console.log("Starting chat stream for chatId:", args.chatId);

    const messages = await ctx.runQuery(internal.messages.internalList, {
      chatId: args.chatId,
    });

    const assistantMessageId = await ctx.runMutation(
      internal.messages.internalCreate,
      {
        chatId: args.chatId,
        role: "assistant",
        content: "",
      },
    );

    try {
      const { textStream } = streamText({
        model: model,
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
      console.error("Error in chat stream:", error);
      await ctx.runMutation(internal.messages.internalUpdate, {
        messageId: assistantMessageId,
        content: "Error: Could not get a response from the AI.",
      });
      throw error;
    }
  },
});
