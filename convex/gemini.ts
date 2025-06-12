import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_API_KEY environment variable is required");
}

const genAI = createGoogleGenerativeAI({
  apiKey,
});

const model = genAI("gemini-2.5-flash-preview-05-20");

export const chat = internalMutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    console.log("Starting chat for chatId:", args.chatId);

    const messages = await ctx.runQuery(api.messages.list, {
      chatId: args.chatId,
    });

    console.log("Retrieved messages:", messages.length);

    const assistantMessageId = await ctx.runMutation(api.messages.create, {
      chatId: args.chatId,
      role: "assistant",
      content: "",
    });

    try {
      const { textStream } = streamText({
        model: model,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      let content = "";

      for await (const part of textStream) {
        content += part;
        await ctx.runMutation(api.messages.update, {
          messageId: assistantMessageId,
          content,
        });
      }

      console.log("Chat completed successfully");
    } catch (error) {
      console.error("Error in chat:", error);
      throw error;
    }
  },
});
