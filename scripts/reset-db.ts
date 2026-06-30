// reset-db.ts — Reset the Prayer Wall data in Deno KV.
//
//   deno task reset          # clear prayers + sessions.
//                            # KEEPS the admin password so you aren't locked out.
//   deno task reset --all    # also remove the admin password (full wipe).
//
// Stop the server first — the local KV is single-writer.

import { kv } from "../src/kv.ts";

const all = Deno.args.includes("--all");

/** Delete every key under a prefix; return how many were removed. */
async function clearPrefix(prefix: Deno.KvKey): Promise<number> {
  let n = 0;
  for await (const entry of kv.list({ prefix })) {
    await kv.delete(entry.key);
    n++;
  }
  return n;
}

const prayers = await clearPrefix(["prayers"]);
await kv.delete(["prayers_seeded"]); // remove the legacy sample-seeding flag
const sessions = await clearPrefix(["session"]);

console.log(`✓ Cleared ${prayers} prayer request(s) and ${sessions} session(s).`);

if (all) {
  await kv.delete(["admin", "password"]);
  console.log("✓ Removed the admin password. Run `deno task set-password` to set a new one.");
} else {
  console.log("  Admin password kept. Use `--all` to remove it too.");
}

kv.close();
