/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as chats from "../chats.js";
import type * as encryptionActions from "../encryptionActions.js";
import type * as gemini from "../gemini.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as myFunctions from "../myFunctions.js";
import type * as openai from "../openai.js";
import type * as openrouter from "../openrouter.js";
import type * as templates from "../templates.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chats: typeof chats;
  encryptionActions: typeof encryptionActions;
  gemini: typeof gemini;
  http: typeof http;
  messages: typeof messages;
  myFunctions: typeof myFunctions;
  openai: typeof openai;
  openrouter: typeof openrouter;
  templates: typeof templates;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
