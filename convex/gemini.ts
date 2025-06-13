// 1. Change the import from internalMutation to internalAction
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api"; // Use internal for calling other functions
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

export const chat = internalAction({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    console.log("Starting chat action for chatId:", args.chatId);

    const messages = await ctx.runQuery(internal.messages.internalList, {
      chatId: args.chatId,
    });

    console.log("Retrieved messages:", messages);

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
        messages: messages.map(
          (message: { role: "user" | "assistant"; content: string }) => ({
            role: message.role,
            content: message.content,
          }),
        ),
      });

      let content = "";

      for await (const part of textStream) {
        content += part;
        await ctx.runMutation(internal.messages.internalUpdate, {
          messageId: assistantMessageId,
          content,
        });
      }

      console.log("Chat action completed successfully");
    } catch (error) {
      console.error("Error in chat action:", error);
      await ctx.runMutation(internal.messages.internalUpdate, {
        messageId: assistantMessageId,
        content: "Error: Could not get a response from the AI.",
      });
      throw error;
    }
  },
});
