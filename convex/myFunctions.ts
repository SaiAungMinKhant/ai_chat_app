import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    const userId = await getAuthUserId(ctx);
    const user = userId === null ? null : await ctx.db.get(userId);
    return {
      viewer: user?.email ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

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
      // Encrypt the API key using the action
      const encryptedApiKey = await ctx.runAction(
        api.encryptionActions.encryptText,
        {
          text: args.apiKey,
        },
      );

      console.log("Original API key:", args.apiKey);
      console.log("Encrypted API key:", encryptedApiKey);
      console.log("Encrypted length:", encryptedApiKey.length);

      await ctx.runMutation(api.myFunctions.updateUserApiKey, {
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

// Helper mutation to update the user's API key
export const updateUserApiKey = mutation({
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

// Function to get decrypted API key (only for internal use)
export const getDecryptedApiKey = action({
  handler: async (ctx): Promise<string | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.runQuery(api.myFunctions.getCurrentUser);
    if (!user?.openRouterApiKey) return null;

    try {
      return await ctx.runAction(api.encryptionActions.decryptText, {
        encryptedText: user.openRouterApiKey,
      });
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      return null;
    }
  },
});

// Function to check what's stored in the database (for debugging)
export const checkStoredApiKey = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user?.openRouterApiKey) return { hasKey: false };

    return {
      hasKey: true,
      storedValue: user.openRouterApiKey,
      length: user.openRouterApiKey.length,
      isEncrypted:
        user.openRouterApiKey.includes(":") &&
        user.openRouterApiKey.length > 50,
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

// Test function to verify encryption is working
export const testEncryption = action({
  args: {
    testString: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    original?: string;
    encrypted?: string;
    decrypted?: string;
    matches?: boolean;
    error?: string;
  }> => {
    try {
      const result = await ctx.runAction(
        api.encryptionActions.testEncryptionAction,
        {
          testString: args.testString,
        },
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
