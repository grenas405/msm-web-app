// prayers.ts — Prayer Wall data layer. One job: persist and read prayer
// requests via Deno KV. Pure, explicit functions — no HTML, no HTTP.

import { PRAYER_CATEGORIES } from "./content.ts";

const kv = await Deno.openKv();

const PRAYERS = "prayers";
const SEEDED = "prayers_seeded";

export type PrayerStatus = "active" | "answered";

export interface Prayer {
  id: string;
  name: string; // empty string => shown as "Anonymous"
  body: string;
  category: string;
  status: PrayerStatus;
  prayedCount: number;
  createdAt: number;
  answeredAt: number | null;
}

export interface PrayerStats {
  requests: number;
  prayersOffered: number;
  answered: number;
}

export interface NewPrayer {
  name: string;
  body: string;
  category: string;
}

/** Create a new active prayer request. Returns the stored record. */
export async function addPrayer(input: NewPrayer): Promise<Prayer> {
  const category = (PRAYER_CATEGORIES as readonly string[]).includes(input.category)
    ? input.category
    : "Other";
  const prayer: Prayer = {
    id: crypto.randomUUID(),
    name: input.name.trim().slice(0, 60),
    body: input.body.trim().slice(0, 600),
    category,
    status: "active",
    prayedCount: 0,
    createdAt: Date.now(),
    answeredAt: null,
  };
  await kv.set([PRAYERS, prayer.id], prayer);
  return prayer;
}

/** List requests with the given status, newest first. */
export async function listPrayers(status: PrayerStatus): Promise<Prayer[]> {
  const out: Prayer[] = [];
  for await (const entry of kv.list<Prayer>({ prefix: [PRAYERS] })) {
    if (entry.value.status === status) out.push(entry.value);
  }
  const time = (p: Prayer) => status === "answered" ? (p.answeredAt ?? 0) : p.createdAt;
  out.sort((a, b) => time(b) - time(a));
  return out;
}

/**
 * Record one more "I prayed for this". Returns the new count, or null if the
 * request no longer exists. Uses an atomic check so concurrent taps don't race.
 */
export async function prayFor(id: string): Promise<number | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const entry = await kv.get<Prayer>([PRAYERS, id]);
    if (!entry.value) return null;
    const updated: Prayer = {
      ...entry.value,
      prayedCount: entry.value.prayedCount + 1,
    };
    const res = await kv.atomic().check(entry).set([PRAYERS, id], updated).commit();
    if (res.ok) return updated.prayedCount;
  }
  return null; // gave up under contention
}

/** Move a request into the answered (testimony) list. */
export async function markAnswered(id: string): Promise<boolean> {
  const entry = await kv.get<Prayer>([PRAYERS, id]);
  if (!entry.value || entry.value.status === "answered") return false;
  const updated: Prayer = {
    ...entry.value,
    status: "answered",
    answeredAt: Date.now(),
  };
  const res = await kv.atomic().check(entry).set([PRAYERS, id], updated).commit();
  return res.ok;
}

/** Aggregate counts for the headline stats row. */
export async function getStats(): Promise<PrayerStats> {
  const stats: PrayerStats = { requests: 0, prayersOffered: 0, answered: 0 };
  for await (const entry of kv.list<Prayer>({ prefix: [PRAYERS] })) {
    stats.requests++;
    stats.prayersOffered += entry.value.prayedCount;
    if (entry.value.status === "answered") stats.answered++;
  }
  return stats;
}

/**
 * Insert a few realistic example requests the first time the app runs, so the
 * wall is never empty in a demo. Runs once, guarded by a flag key.
 */
export async function seedIfEmpty(): Promise<void> {
  const flag = await kv.get([SEEDED]);
  if (flag.value) return;

  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const samples: Prayer[] = [
    {
      id: crypto.randomUUID(),
      name: "Grace O.",
      body:
        "Please pray for my mother's surgery this Friday — for steady hands for the surgeons and peace over our whole family.",
      category: "Healing",
      status: "active",
      prayedCount: 12,
      createdAt: now - 5 * hour,
      answeredAt: null,
    },
    {
      id: crypto.randomUUID(),
      name: "",
      body:
        "Believing God for a new job after a long season of waiting. Standing on Philippians 4:19.",
      category: "Provision",
      status: "active",
      prayedCount: 8,
      createdAt: now - 26 * hour,
      answeredAt: null,
    },
    {
      id: crypto.randomUUID(),
      name: "Daniel",
      body:
        "Pray for my younger brother to encounter Jesus. He feels far from God right now, but I know nothing is too hard for the Lord.",
      category: "Salvation",
      status: "active",
      prayedCount: 21,
      createdAt: now - 50 * hour,
      answeredAt: null,
    },
    {
      id: crypto.randomUUID(),
      name: "Ruth M.",
      body:
        "Thank you, church, for praying with me — the biopsy came back completely clear. God is so faithful!",
      category: "Thanksgiving",
      status: "answered",
      prayedCount: 34,
      createdAt: now - 9 * 24 * hour,
      answeredAt: now - 2 * 24 * hour,
    },
  ];

  const tx = kv.atomic().set([SEEDED], true);
  for (const p of samples) tx.set([PRAYERS, p.id], p);
  await tx.commit();
}
