import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  chats: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    visibility: v.union(v.literal("public"), v.literal("private")),
  }).index("by_userId", ["userId"]),
  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    model: v.optional(v.string()),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("streaming"),
        v.literal("completed"),
        v.literal("error"),
        v.literal("stopped"),
      ),
    ),
  }).index("by_chatId", ["chatId"]),
  templates: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    category: v.union(
      v.literal("summary"),
      v.literal("compare"),
      v.literal("research"),
      v.literal("custom"),
    ),
    isDefault: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    openRouterApiKey: v.optional(v.string()),
  }).index("email", ["email"]),
});
