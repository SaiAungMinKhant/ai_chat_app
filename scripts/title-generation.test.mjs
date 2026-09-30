import { expect, mock, test } from "bun:test";

process.env.OPENROUTER_API_KEY = "test-key";

mock.module("ai", () => ({
  smoothStream: () => undefined,
  streamText: () => ({
    textStream: (async function* () {
      yield "Answer";
    })(),
  }),
  generateText: async () => ({ text: "Generated title" }),
}));

mock.module("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => () => ({}),
}));

test("first completed assistant response schedules a title", async () => {
  const { chatStream } = await import("../convex/openrouter");
  const titleCalls = [];
  const ctx = {
    runQuery: async (_name, args) => {
      if (args.chatId && args.userId) return true;
      if (args.chatId) return [{ role: "user", content: "first question" }];
      return null;
    },
    runMutation: async (_name, args) => {
      return args.role ? "message-id" : true;
    },
    scheduler: {
      runAfter: async (_delay, _name, args) => {
        titleCalls.push(args);
      },
    },
  };

  await chatStream._handler(ctx, {
    chatId: "chat-id",
    userId: "user-id",
    modelName: "openai/gpt-4.1-nano",
  });

  expect(titleCalls).toHaveLength(1);
  expect(titleCalls[0]).toEqual({
    chatId: "chat-id",
    userId: "user-id",
    modelName: "openai/gpt-4.1-nano",
  });
});

test("title action saves a generated name", async () => {
  const { generateTitle } = await import("../convex/openrouter");
  const writes = [];
  const ctx = {
    runQuery: async (_name, args) => {
      if (args.chatId && args.userId) return true;
      if (args.chatId) {
        return [
          { role: "user", content: "first question" },
          { role: "assistant", content: "Answer", status: "completed" },
        ];
      }
      return null;
    },
    runMutation: async (_name, args) => writes.push(args),
  };

  await generateTitle._handler(ctx, {
    chatId: "chat-id",
    userId: "user-id",
    modelName: "openai/gpt-4.1-nano",
  });

  expect(writes).toEqual([
    { chatId: "chat-id", userId: "user-id", title: "Generated title" },
  ]);
});

test("automatic title cannot overwrite a manual rename", async () => {
  const { updateTitle } = await import("../convex/chats");
  const patches = [];
  const ctx = {
    db: {
      get: async () => ({ userId: "user-id", title: "My own name" }),
      patch: async (...args) => patches.push(args),
    },
  };

  await updateTitle._handler(ctx, {
    chatId: "chat-id",
    userId: "user-id",
    title: "Generated title",
  });

  expect(patches).toHaveLength(0);
});

test("generated title replaces New Chat", async () => {
  const { updateTitle } = await import("../convex/chats");
  const patches = [];
  const ctx = {
    db: {
      get: async () => ({ userId: "user-id", title: "New Chat" }),
      patch: async (...args) => patches.push(args),
    },
  };

  await updateTitle._handler(ctx, {
    chatId: "chat-id",
    userId: "user-id",
    title: "Generated title",
  });

  expect(patches).toEqual([["chat-id", { title: "Generated title" }]]);
});

test("owner can rename a chat and surrounding spaces are removed", async () => {
  const { rename } = await import("../convex/chats");
  const patches = [];
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject: "user-id" }) },
    db: {
      get: async () => ({ userId: "user-id", title: "New Chat" }),
      patch: async (...args) => patches.push(args),
    },
  };

  await rename._handler(ctx, { chatId: "chat-id", title: "  My title  " });

  expect(patches).toEqual([["chat-id", { title: "My title" }]]);
});

test("another user cannot rename a chat", async () => {
  const { rename } = await import("../convex/chats");
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject: "other-user" }) },
    db: {
      get: async () => ({ userId: "user-id", title: "New Chat" }),
      patch: async () => {
        throw new Error("should not patch");
      },
    },
  };

  await expect(
    rename._handler(ctx, { chatId: "chat-id", title: "Stolen" }),
  ).rejects.toThrow("Chat not found or unauthorized");
});
