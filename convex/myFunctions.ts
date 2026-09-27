import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// API Key management functions

export const setOpenRouterApiKey = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Validate the API key format (OpenRouter keys start with "sk-or-")
    if (!args.apiKey.startsWith("sk-or-")) {
      throw new Error("Invalid OpenRouter API key format");
    }

    try {
      const encryptedApiKey = await ctx.runAction(
        internal.encryptionActions.encryptText,
        {
          text: args.apiKey,
        },
      );

      await ctx.runMutation(internal.myFunctions.updateUserApiKey, {
        userId,
        encryptedApiKey,
      });

      return { success: true };
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt API key. Please try again.");
    }
  },
});

export const updateUserApiKey = internalMutation({
  args: {
    userId: v.id("users"),
    encryptedApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      openRouterApiKey: args.encryptedApiKey,
    });
  },
});

export const getEncryptedApiKey = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.openRouterApiKey ?? null;
  },
});

export const deleteOpenRouterApiKey = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    await ctx.db.patch(userId, {
      openRouterApiKey: undefined,
    });

    return { success: true };
  },
});

export const hasOpenRouterApiKey = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const user = await ctx.db.get(userId);
    return !!user?.openRouterApiKey;
  },
});

export const getDecryptedApiKey = action({
  handler: async (ctx): Promise<string | null> => {
    const user = await ctx.runQuery(api.myFunctions.getCurrentUser);
    if (!user?.openRouterApiKey) return null;

    try {
      return await ctx.runAction(internal.encryptionActions.decryptText, {
        encryptedText: user.openRouterApiKey,
      });
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      return null;
    }
  },
});
