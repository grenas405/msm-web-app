// lessons.ts — Sunday School lessons data layer.
//
// Metadata (title, date) lives in Deno KV; the PDF bytes live on disk under
// a data directory (MSM_DATA_DIR, default ./data). One job: store, list, and
// remove lessons. No HTML, no HTTP.

import { kv } from "./kv.ts";

const LESSONS = "lessons";
const DATA_DIR = Deno.env.get("MSM_DATA_DIR") ?? "./data";
const LESSONS_DIR = `${DATA_DIR}/lessons`;

// Make sure the storage directory exists (no-op if it already does).
await Deno.mkdir(LESSONS_DIR, { recursive: true });

export interface Lesson {
  id: string;
  title: string;
  date: string; // ISO date, e.g. "2024-08-04"
  size: number; // bytes
  createdAt: number;
}

/** Absolute-ish path to a lesson's PDF on disk. */
export function lessonPath(id: string): string {
  return `${LESSONS_DIR}/${id}.pdf`;
}

/** Store a new lesson: write the PDF to disk, save metadata in KV. */
export async function addLesson(
  input: { title: string; date: string },
  bytes: Uint8Array,
): Promise<Lesson> {
  const lesson: Lesson = {
    id: crypto.randomUUID(),
    title: input.title.trim().slice(0, 160) || "Untitled lesson",
    date: normalizeDate(input.date),
    size: bytes.byteLength,
    createdAt: Date.now(),
  };
  await Deno.writeFile(lessonPath(lesson.id), bytes);
  await kv.set([LESSONS, lesson.id], lesson);
  return lesson;
}

/** All lessons, newest lesson date first. */
export async function listLessons(): Promise<Lesson[]> {
  const out: Lesson[] = [];
  for await (const entry of kv.list<Lesson>({ prefix: [LESSONS] })) {
    out.push(entry.value);
  }
  out.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  return out;
}

/** Look up a single lesson's metadata. */
export async function getLesson(id: string): Promise<Lesson | null> {
  const entry = await kv.get<Lesson>([LESSONS, id]);
  return entry.value;
}

/** Remove a lesson's metadata and its PDF file. */
export async function deleteLesson(id: string): Promise<boolean> {
  const lesson = await getLesson(id);
  if (!lesson) return false;
  await kv.delete([LESSONS, id]);
  await Deno.remove(lessonPath(id)).catch(() => {}); // tolerate a missing file
  return true;
}

/** Keep dates as YYYY-MM-DD; fall back to today on bad input. */
function normalizeDate(value: string): string {
  const match = value.trim().match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return new Date().toISOString().slice(0, 10);
}
