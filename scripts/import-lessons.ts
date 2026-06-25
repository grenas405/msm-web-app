// import-lessons.ts — One-time migration of Sunday School lessons from the old
// Weebly site into the new Sunday School archive.
//
//   deno task import-lessons --dry   # list date → file mappings, download nothing
//   deno task import-lessons 5       # import only the first 5 (for a test)
//   deno task import-lessons         # import them all
//
// The lessons were posted weekly, every Sunday starting 2022-08-14, so the date
// for each file is computed from its position. Re-running is safe: already-
// imported files are skipped (tracked by a marker key in KV).

import { addLesson } from "../src/lessons.ts";
import { kv } from "../src/kv.ts";

const BASE = "https://msmokc.weebly.com/uploads/1/3/0/1/130172340/";
const START = Date.UTC(2022, 7, 14); // 2022-08-14
const WEEK = 7 * 24 * 60 * 60 * 1000;

// PDF file stems in chronological order (one per Sunday). ".pdf" is appended.
const FILES = [
  "sl6",
  "sl7",
  "sl8",
  "hf1",
  "hf2",
  "hf3",
  "hf4",
  "hf5",
  "hf6",
  "hf7",
  "hf8",
  "d1",
  "d2",
  "d3",
  "d4",
  "d5",
  "d6",
  "d7",
  "d8",
  "d9",
  "d10",
  "d11",
  "d12",
  "de1",
  "de2",
  "de3",
  "de4",
  "de5",
  "de6",
  "de7",
  "de8",
  "de9",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "a8",
  "otc1",
  "otc2",
  "otc3",
  "otc4",
  "otc5",
  "otc6",
  "otc7",
  "otc8",
  "otc9",
  "otc10",
  "otc11",
  "otc12",
  "m1",
  "m2",
  "m3",
  "m4001",
  "m5",
  "m6",
  "m7",
  "m8",
  "m9",
  "m10",
  "m11",
  "m12",
  "fs1",
  "fs2",
  "fs3",
  "fs4",
  "fs5",
  "fs6",
  "fs7",
  "fs8",
  "fs9",
  "fs10",
  "sw1",
  "sw2",
  "sw3",
  "sw4001",
  "sw5",
  "sw6",
  "sw7",
  "sw8",
  "sw9",
  "sw10",
  "sw11",
  "sw12",
  "i1",
  "i2",
  "i3",
  "i4",
  "i5",
  "i6",
  "i7",
  "i8",
  "i9",
  "i10",
  "ntc1",
  "ntc2",
  "ntc3",
  "ntc4",
  "ntc5",
  "ntc6",
  "ntc7",
  "ntc8",
  "ntc9",
  "ntc10",
  "int1",
  "int2",
  "int3001",
  "int4001",
  "int5001",
  "int6001",
  "int7001",
  "int8001",
  "int9001",
  "int10001",
  "tag1001",
  "tag2001__1_",
  "tag3001",
  "tag4001",
  "tag5001",
  "tag6001",
  "lesson7",
  "tag8001",
  "swi",
  "spw2001",
  "spw3001",
  "spw4001",
  "spw5001__1_",
  "spw6001",
  "spw7001",
  "spw8001",
  "gtlc1",
  "gtlc2",
  "gtlc3",
  "gtlc4",
  "gtlc5",
  "gtlc6",
  "gtlc7",
  "gtlc8",
  "gtlc9",
  "gtlc10",
  "gtlc11",
  "gtlc12",
  "tpj1_2",
  "tpj1_3",
  "tpj1_4",
  "tpj1_5",
  "tpj1_6",
  "tpj1_7",
  "tpj1_8",
  "tpj1_9",
  "tpj1_10",
  "tpj1_11",
  "tpj1_12",
  "som_1",
  "som_2",
  "som_3",
  "som_4",
  "som_5",
  "som_6",
  "som_7",
  "som_8",
  "som_9",
  "som_10",
  "som_11",
  "matt_1001",
  "matt_2",
  "matt_3",
  "matt_4",
  "matt_5",
  "matt_6",
  "matt7",
  "matt8",
  "matt9",
  "matt10",
  "matt11",
  "matt12",
  "mrk1",
  "mrk2001",
  "mrk3001",
  "mrk4",
  "mrk5",
  "mrk6",
  "mrk7",
  "mrk8",
  "mrk9",
  "mrk10",
  "mrk11",
  "mrk12",
  "luke1",
  "luke2",
  "luke3",
  "luke4",
  "luke5",
  "luke6",
  "luke7",
  "luke8",
  "luke9",
  "luke10",
  "luke11",
  "luke12",
  "john1",
];

/** ISO date (YYYY-MM-DD) for the lesson at a given position. */
function dateFor(index: number): string {
  return new Date(START + index * WEEK).toISOString().slice(0, 10);
}

// Alignment guard: the last file must land on the known final Sunday.
const lastDate = dateFor(FILES.length - 1);
if (lastDate !== "2026-06-28") {
  console.error(
    `✗ Date alignment check failed: last lesson computed as ${lastDate}, expected 2026-06-28. ` +
      `The FILES list is likely missing or has an extra entry — not importing.`,
  );
  Deno.exit(1);
}

const dry = Deno.args.includes("--dry");
const limitArg = Deno.args.find((a) => /^\d+$/.test(a));
const limit = limitArg ? Number(limitArg) : FILES.length;

if (dry) {
  FILES.slice(0, limit).forEach((file, i) => console.log(`${dateFor(i)}  ${file}.pdf`));
  console.log(`\n${Math.min(limit, FILES.length)} lessons (dry run, nothing downloaded).`);
  kv.close();
  Deno.exit(0);
}

let added = 0, skipped = 0, failed = 0;
for (let i = 0; i < Math.min(limit, FILES.length); i++) {
  const file = FILES[i];
  const date = dateFor(i);
  const marker = ["imported_lesson", file];
  if ((await kv.get(marker)).value) {
    skipped++;
    continue;
  }
  try {
    const res = await fetch(`${BASE}${file}.pdf`);
    if (!res.ok) {
      console.error(`✗ ${date} ${file}.pdf (HTTP ${res.status})`);
      failed++;
      continue;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    await addLesson({ title: "Sunday School Lesson", date }, bytes);
    await kv.set(marker, true);
    added++;
    if (added % 20 === 0) console.log(`… ${added} imported`);
    await new Promise((r) => setTimeout(r, 120)); // be gentle on the old host
  } catch (e) {
    console.error(`✗ ${date} ${file}.pdf: ${(e as Error).message}`);
    failed++;
  }
}

console.log(`\nDone. Imported ${added}, skipped ${skipped} (already present), failed ${failed}.`);
kv.close();
