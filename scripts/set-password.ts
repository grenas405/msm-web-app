// set-password.ts — Set or change the admin password for the site.
//
//   deno task set-password               # prompts (input hidden)
//   deno task set-password "my-secret"   # non-interactive (CI / scripts)
//
// The password is hashed with PBKDF2 and stored in Deno KV; it is never
// written to disk in plaintext.

import { setPassword } from "../src/auth.ts";
import { kv } from "../src/kv.ts";

const MIN_LENGTH = 8;

/** Read a line from stdin without echoing it (shows asterisks). */
async function readSecret(label: string): Promise<string> {
  const enc = new TextEncoder();
  await Deno.stdout.write(enc.encode(label));

  if (!Deno.stdin.isTerminal()) {
    // Piped input — read a plain line, no masking possible.
    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf) ?? 0;
    return new TextDecoder().decode(buf.subarray(0, n)).replace(/\r?\n$/, "");
  }

  Deno.stdin.setRaw(true);
  const bytes: number[] = [];
  const one = new Uint8Array(1);
  try {
    while (true) {
      const n = await Deno.stdin.read(one);
      if (n === null) break;
      const c = one[0];
      if (c === 3) { // Ctrl-C
        await Deno.stdout.write(enc.encode("\n"));
        Deno.exit(130);
      }
      if (c === 13 || c === 10) break; // Enter
      if (c === 127 || c === 8) { // Backspace
        if (bytes.length > 0) {
          bytes.pop();
          await Deno.stdout.write(enc.encode("\b \b"));
        }
        continue;
      }
      bytes.push(c);
      await Deno.stdout.write(enc.encode("*"));
    }
  } finally {
    Deno.stdin.setRaw(false);
  }
  await Deno.stdout.write(enc.encode("\n"));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

async function main() {
  const fromArg = Deno.args[0];
  let password: string;

  if (fromArg) {
    password = fromArg;
  } else {
    password = await readSecret("New admin password: ");
    const confirm = await readSecret("Confirm password:   ");
    if (password !== confirm) {
      console.error("\n✗ Passwords did not match. Nothing was changed.");
      Deno.exit(1);
    }
  }

  if (password.length < MIN_LENGTH) {
    console.error(`\n✗ Password must be at least ${MIN_LENGTH} characters.`);
    Deno.exit(1);
  }

  await setPassword(password);
  console.log("\n✓ Admin password set. Sign in at /admin/login");
  kv.close();
}

if (import.meta.main) {
  await main();
}
