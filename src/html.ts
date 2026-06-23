// html.ts — Minimal, explicit HTML templating helpers.
// One job: build HTML strings safely. No framework, no state.

/** Escape a string for safe insertion into HTML text or attributes. */
export function escape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Tagged template that auto-escapes interpolated values.
 * Wrap a value in `raw()` to opt out of escaping (for trusted nested HTML).
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + strings[i + 1];
  }
  return out;
}

/** Marker for trusted, pre-rendered HTML that must not be escaped. */
const RAW = Symbol("raw");
export interface Raw {
  [RAW]: true;
  value: string;
}

export function raw(value: string): Raw {
  return { [RAW]: true, value };
}

function isRaw(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && RAW in value;
}

/** Render a single interpolated value to a string. */
function render(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (isRaw(value)) return value.value;
  if (Array.isArray(value)) return value.map(render).join("");
  return escape(String(value));
}

/** Join an array of trusted HTML fragments into one raw block. */
export function join(fragments: string[]): Raw {
  return raw(fragments.join(""));
}
