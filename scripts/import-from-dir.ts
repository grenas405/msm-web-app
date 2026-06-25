// import-from-dir.ts — Import Sunday School lessons from a local folder of PDFs
// named "YYYY-MM-DD.pdf". Used by the VPS migration when the server can't reach
// the old Weebly site directly (its CDN blocks datacenter IPs).
//
//   deno task import-from-dir ./lessons-bundle
//
// Idempotent: a lesson whose date was already imported is skipped.

import { addLesson } from "../src/lessons.ts";
import { kv } from "../src/kv.ts";

const dir = Deno.args[0];
if (!dir) {
  console.error("Usage: deno task import-from-dir <directory of YYYY-MM-DD.pdf files>");
  Deno.exit(1);
}

const names: string[] = [];
for await (const entry of Deno.readDir(dir)) {
  if (entry.isFile && entry.name.endsWith(".pdf")) names.push(entry.name);
}
names.sort();

let added = 0, skipped = 0, failed = 0;
for (const name of names) {
  const date = name.slice(0, -4); // strip ".pdf"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error(`✗ ${name} (name is not YYYY-MM-DD.pdf)`);
    failed++;
    continue;
  }
  const marker = ["imported_lesson", date];
  if ((await kv.get(marker)).value) {
    skipped++;
    continue;
  }
  try {
    const bytes = await Deno.readFile(`${dir}/${name}`);
    await addLesson({ title: "Sunday School Lesson", date }, bytes);
    await kv.set(marker, true);
    added++;
    console.log(`✓ ${date} (${(bytes.length / 1024 / 1024).toFixed(1)} MB)`);
  } catch (e) {
    console.error(`✗ ${name}: ${(e as Error).message}`);
    failed++;
  }
}

console.log(`\nDone. Imported ${added}, skipped ${skipped} (already present), failed ${failed}.`);
kv.close();
