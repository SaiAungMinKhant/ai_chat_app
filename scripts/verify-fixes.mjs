// Local-only check against `npx convex dev` with a local deployment.
// Needs OPENROUTER_BASE_URL=http://127.0.0.1:4545/api/v1 set on that deployment so chat traffic hits the fake server below.

import http from "node:http";
import fs from "node:fs";
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { anyApi as api } from "convex/server";

const CONVEX_URL = "http://127.0.0.1:3210";
const FAKE_PORT = 4545;
const DEV_LOG = "/tmp/convex-dev.log";
const USER_KEY = `sk-or-USER-${Date.now()}`;

const requests = [];
let streamPlan = { words: 5, delayMs: 5 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw || "{}");
  requests.push({ auth: req.headers.authorization, body });
  const base = { id: "gen-1", object: "chat.completion.chunk", created: 0, model: body.model };
  if (!body.stream) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ...base, object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "Fake Title" }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
    return;
  }
  res.writeHead(200, { "content-type": "text/event-stream" });
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  const { words, delayMs } = streamPlan;
  for (let i = 0; i < words && !res.destroyed; i++) {
    send({ ...base, choices: [{ index: 0, delta: { role: "assistant", content: `w${i} ` }, finish_reason: null }] });
    await sleep(delayMs);
  }
  send({ ...base, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: words, total_tokens: words + 1 } });
  res.end("data: [DONE]\n\n");
});
await new Promise((r) => server.listen(FAKE_PORT, "127.0.0.1", r));

const results = [];
const check = (name, ok, detail) => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

async function signUp(email) {
  const anon = new ConvexHttpClient(CONVEX_URL);
  const { tokens } = await anon.action(api.auth.signIn, {
    provider: "password",
    params: { email, password: "correct-horse-battery", flow: "signUp" },
  });
  const http = new ConvexHttpClient(CONVEX_URL);
  http.setAuth(tokens.token);
  const ws = new ConvexClient(CONVEX_URL);
  ws.setAuth(async () => tokens.token);
  const me = await http.query(api.myFunctions.getCurrentUser, {});
  return { http, ws, id: me._id };
}

async function waitForAssistant(client, chatId, predicate, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const msgs = await client.query(api.messages.list, { chatId });
    const last = msgs.filter((m) => m.role === "assistant").at(-1);
    if (last && predicate(last)) return { msgs, last };
    await sleep(100);
  }
  throw new Error("timed out waiting for assistant message");
}

const stamp = Date.now();
const alice = await signUp(`alice-${stamp}@test.dev`);
const mallory = await signUp(`mallory-${stamp}@test.dev`);
const anon = new ConvexHttpClient(CONVEX_URL);

await alice.http.action(api.myFunctions.setOpenRouterApiKey, { apiKey: USER_KEY });
const aliceDoc = await alice.http.query(api.myFunctions.getCurrentUser, {});

let overwrote = false;
try {
  await mallory.http.mutation(api.myFunctions.updateUserApiKey, { userId: alice.id, encryptedApiKey: "attacker" });
  overwrote = true;
} catch {}
const aliceAfter = await alice.http.query(api.myFunctions.getCurrentUser, {});
check("other users cannot overwrite a user's API key", !overwrote && aliceAfter.openRouterApiKey === aliceDoc.openRouterApiKey);

let decrypted = null;
try {
  decrypted = await anon.action(api.encryptionActions.decryptText, { encryptedText: aliceDoc.openRouterApiKey });
} catch {}
check("unauthenticated clients cannot use the decrypt action", decrypted === null, decrypted ? `got ${decrypted}` : "");

const readBack = await alice.http.action(api.myFunctions.getDecryptedApiKey, {});
const anonReadBack = await anon.action(api.myFunctions.getDecryptedApiKey, {});
check("settings page reads back only the signed-in user's key", readBack === USER_KEY && anonReadBack === null);

await sleep(1500);
const devLog = fs.readFileSync(DEV_LOG, "utf8");
check("raw API key never appears in server logs", !devLog.includes(USER_KEY));

streamPlan = { words: 5, delayMs: 5 };
requests.length = 0;
const chatId = await alice.http.mutation(api.chats.sendMessage, { content: "first question", model: "openai/gpt-4.1-nano" });
await waitForAssistant(alice.http, chatId, (m) => m.status === "completed");
const firstStream = requests.find((r) => r.body.stream);
check("chat uses the user's own OpenRouter key", firstStream?.auth === `Bearer ${USER_KEY}`, `sent ${firstStream?.auth}`);

requests.length = 0;
await alice.http.mutation(api.messages.sendWithOpenRouter, { chatId, content: "second question", modelName: "openai/gpt-4.1-nano" });
await waitForAssistant(alice.http, chatId, (m) => m.status === "completed" && m._creationTime > 0);
await sleep(300);
const secondStream = requests.find((r) => r.body.stream);
const roles = (secondStream?.body.messages ?? []).map((m) => m.role).join(",");
check("conversation is sent with per-message roles", roles === "user,assistant,user", `roles=${roles}`);

streamPlan = { words: 150, delayMs: 10 };
const contents = new Set();
const unsubscribe = alice.ws.onUpdate(api.messages.list, { chatId }, (msgs) => {
  const last = msgs.at(-1);
  if (last?.role === "assistant") contents.add(last.content);
});
await alice.http.mutation(api.messages.sendWithOpenRouter, { chatId, content: "long answer please", modelName: "openai/gpt-4.1-nano" });
const { last: longMsg } = await waitForAssistant(alice.http, chatId, (m) => m.status === "completed" && m.content.includes("w149"));
unsubscribe();
check("long answer arrives complete", longMsg.content.trim().split(" ").length === 150);
check("streaming writes are throttled", contents.size < 40, `${contents.size} distinct DB states for 150 chunks`);

streamPlan = { words: 400, delayMs: 15 };
await alice.http.mutation(api.messages.sendWithOpenRouter, { chatId, content: "stop me", modelName: "openai/gpt-4.1-nano" });
await waitForAssistant(alice.http, chatId, (m) => m.status === "streaming" && m.content.length > 0);
await sleep(800);
await alice.http.mutation(api.messages.stopGeneration, { chatId });
const { last: stoppedAt } = await waitForAssistant(alice.http, chatId, (m) => m.status === "stopped");
await sleep(2500);
const { last: stoppedLater } = await waitForAssistant(alice.http, chatId, () => true);
check("stop keeps status stopped", stoppedLater.status === "stopped", `status=${stoppedLater.status}`);
check("stop freezes content", stoppedLater.content === stoppedAt.content, `len ${stoppedAt.content.length} -> ${stoppedLater.content.length}`);

await alice.ws.close();
await mallory.ws.close();
server.close();
const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
