"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

// Ensure the key is 32 bytes (256 bits) for AES-256
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = createDecipheriv("aes-256-cbc", key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export const encryptText = action({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    return encrypt(args.text);
  },
});

export const decryptText = action({
  args: { encryptedText: v.string() },
  handler: async (ctx, args) => {
    return decrypt(args.encryptedText);
  },
});

export const testEncryptionAction = action({
  args: { testString: v.string() },
  handler: async (ctx, args) => {
    try {
      const encrypted = encrypt(args.testString);
      const decrypted = decrypt(encrypted);

      return {
        success: true,
        original: args.testString,
        encrypted: encrypted,
        decrypted: decrypted,
        matches: args.testString === decrypted,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
