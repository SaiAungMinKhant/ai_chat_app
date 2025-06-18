import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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
    const messages = await ctx.runQuery(internal.messages.internalList, {
      chatId: args.chatId,
    });

    const assistantMessageId = await ctx.runMutation(
      internal.messages.internalCreate,
      {
        chatId: args.chatId,
        role: "assistant",
        content: "",
        status: "streaming",
      },
    );

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

      const currentMessage = await ctx.runQuery(internal.messages.internalGet, {
        messageId: assistantMessageId,
      });

      if (currentMessage?.status === "stopped") {
        break;
      }

      await ctx.runMutation(internal.messages.internalUpdate, {
        messageId: assistantMessageId,
        content,
      });
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
  },
});
