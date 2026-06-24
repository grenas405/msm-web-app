// kv.ts — The single shared Deno KV handle for the whole app.
// Open it once here and import `kv` everywhere, so every module reads and
// writes the same store (prayers, admin password, sessions).
//
// Set MSM_KV_PATH to pin the database to a specific file (recommended for
// local/self-hosted runs so every process — server and the set-password
// script — share one store). When unset, Deno's managed/default KV is used
// (the right choice on Deno Deploy).

const path = Deno.env.get("MSM_KV_PATH");
export const kv = path ? await Deno.openKv(path) : await Deno.openKv();
