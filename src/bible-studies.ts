// bible-studies.ts — Friday Bible Study link data layer.
//
// Each entry points to an externally hosted Bible chapter or passage. Metadata
// lives in Deno KV so the pastor can maintain the page from the admin area.

import { kv } from "./kv.ts";

const BIBLE_STUDIES = "bible_studies";

export interface BibleStudyLink {
  id: string;
  reference: string;
  date: string; // ISO date, e.g. "2026-07-03"
  url: string;
  createdAt: number;
}

export interface NewBibleStudyLink {
  reference: string;
  date: string;
  url: string;
}

/** Validate and store a new Friday study link. */
export async function addBibleStudyLink(
  input: NewBibleStudyLink,
): Promise<BibleStudyLink | null> {
  const reference = input.reference.trim().slice(0, 120);
  const date = normalizeDate(input.date);
  const url = normalizeHttpUrl(input.url);
  if (!reference || !date || !url) return null;

  const study: BibleStudyLink = {
    id: crypto.randomUUID(),
    reference,
    date,
    url,
    createdAt: Date.now(),
  };
  await kv.set([BIBLE_STUDIES, study.id], study);
  return study;
}

/** List study links by study date, newest first. */
export async function listBibleStudyLinks(): Promise<BibleStudyLink[]> {
  const out: BibleStudyLink[] = [];
  for await (const entry of kv.list<BibleStudyLink>({ prefix: [BIBLE_STUDIES] })) {
    out.push(entry.value);
  }
  out.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  return out;
}

/** Permanently remove one study link. */
export async function deleteBibleStudyLink(id: string): Promise<boolean> {
  if (!id) return false;
  const entry = await kv.get<BibleStudyLink>([BIBLE_STUDIES, id]);
  if (!entry.value) return false;
  const result = await kv.atomic().check(entry).delete([BIBLE_STUDIES, id]).commit();
  return result.ok;
}

/** Accept only real calendar dates written as YYYY-MM-DD. */
function normalizeDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) &&
      date.getUTCMonth() === Number(month) - 1 &&
      date.getUTCDate() === Number(day)
    ? `${year}-${month}-${day}`
    : null;
}

/** Allow only ordinary web links; reject javascript:, data:, and malformed values. */
function normalizeHttpUrl(value: string): string | null {
  const candidate = value.trim().slice(0, 2048);
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
