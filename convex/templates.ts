import { v } from "convex/values";
import { query, mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserTemplates = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();

    return templates;
  },
});

export const getTemplatesByCategory = query({
  args: {
    category: v.union(
      v.literal("summary"),
      v.literal("compare"),
      v.literal("research"),
      v.literal("custom"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .order("asc")
      .collect();

    return templates;
  },
});

export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    category: v.union(
      v.literal("summary"),
      v.literal("compare"),
      v.literal("research"),
      v.literal("custom"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const templateId = await ctx.db.insert("templates", {
      userId,
      name: args.name,
      description: args.description,
      content: args.content,
      category: args.category,
      isDefault: false,
    });

    return templateId;
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.id("templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("summary"),
        v.literal("compare"),
        v.literal("research"),
        v.literal("custom"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== userId) {
      throw new Error("Template not found or unauthorized");
    }

    const { templateId, ...updates } = args;
    await ctx.db.patch(templateId, updates);
  },
});

export const deleteTemplate = mutation({
  args: {
    templateId: v.id("templates"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== userId) {
      throw new Error("Template not found or unauthorized");
    }

    await ctx.db.delete(args.templateId);
  },
});

const DEFAULT_TEMPLATES = [
  {
    name: "Summarize",
    description: "Get a concise summary of the content",
    content:
      "Please provide a clear and concise summary of the following content, highlighting the key points and main ideas:",
    category: "summary",
  },
  {
    name: "Compare and Contrast",
    description: "Compare two or more items or concepts",
    content:
      "Please compare and contrast the following items/concepts, highlighting their similarities and differences:",
    category: "compare",
  },
  {
    name: "Research Analysis",
    description: "Conduct thorough research and analysis",
    content:
      "Please conduct a thorough research analysis on the following topic, providing detailed insights and supporting evidence:",
    category: "research",
  },
] as const;

export async function insertDefaultTemplates(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  for (const template of DEFAULT_TEMPLATES) {
    await ctx.db.insert("templates", { userId, ...template, isDefault: true });
  }
}
