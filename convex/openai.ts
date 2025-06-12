import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const model = openai("gpt-4-turbo");

export const chat = internalMutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.runQuery(api.messages.list, {
      chatId: args.chatId,
    });

    const assistantMessageId = await ctx.runMutation(api.messages.create, {
      chatId: args.chatId,
      role: "assistant",
      content: "",
    });

    const { textStream } = streamText({
      model: model,
      system: "You are a helpful assistant.",
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
  },
});
