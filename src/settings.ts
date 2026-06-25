// settings.ts — Editable contact details, backed by Deno KV.
//
// Defaults come from content.ts. The pastor can override them at /admin/contact
// without touching code. Because the page builders are synchronous, the current
// values are cached in memory (this is a single process) and refreshed whenever
// they're loaded at startup or saved from the admin form.

import { kv } from "./kv.ts";
import { CONTACT, GIVING } from "./content.ts";

export interface Phone {
  display: string;
  href: string;
}

export interface ContactInfo {
  pastor: string;
  email: string;
  zelleEmail: string;
  phones: Phone[];
  address: { line1: string; detail: string; city: string; state: string; zip: string };
  zoom: string;
}

const KEY = ["settings", "contact"];

/** The built-in defaults, used until the pastor saves an override. */
const DEFAULTS: ContactInfo = {
  pastor: CONTACT.pastor,
  email: CONTACT.email,
  zelleEmail: GIVING.zelleEmail,
  phones: CONTACT.phones.map((p) => ({ display: p.display, href: p.href })),
  address: { ...CONTACT.address },
  zoom: CONTACT.zoom,
};

// In-memory cache of the live values.
let current: ContactInfo = DEFAULTS;

/** The live contact details used by every page. */
export function contact(): ContactInfo {
  return current;
}

/** Load saved overrides from KV into the in-memory cache (call at startup). */
export async function loadContact(): Promise<void> {
  const entry = await kv.get<ContactInfo>(KEY);
  current = entry.value
    ? {
      ...DEFAULTS,
      ...entry.value,
      address: { ...DEFAULTS.address, ...entry.value.address },
    }
    : DEFAULTS;
}

/** Raw form fields submitted from the admin Contact Info page. */
export interface ContactInput {
  pastor: string;
  email: string;
  zelleEmail: string;
  phones: string; // one number per line
  line1: string;
  detail: string;
  city: string;
  state: string;
  zip: string;
  zoom: string;
}

/** Validate, persist, and apply edited contact details. */
export async function saveContact(input: ContactInput): Promise<void> {
  const phones = parsePhones(input.phones);
  const info: ContactInfo = {
    pastor: clean(input.pastor, 80) || DEFAULTS.pastor,
    email: clean(input.email, 120),
    zelleEmail: clean(input.zelleEmail, 120),
    phones: phones.length > 0 ? phones : DEFAULTS.phones,
    address: {
      line1: clean(input.line1, 120),
      detail: clean(input.detail, 80),
      city: clean(input.city, 80),
      state: clean(input.state, 20),
      zip: clean(input.zip, 20),
    },
    zoom: clean(input.zoom, 500),
  };
  await kv.set(KEY, info);
  current = info;
}

function clean(value: string, max: number): string {
  return value.trim().slice(0, max);
}

/** Turn a textarea of phone numbers (one per line) into display + tel: pairs. */
function parsePhones(raw: string): Phone[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 6)
    .map((display) => ({ display, href: telHref(display) }));
}

/** Build a tel: link from a display number (assumes US if 10 digits). */
function telHref(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}
