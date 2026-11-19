import type { Filters, FilterField } from "@/lib/videos/filter";

export const FILTER_LABELS: Record<FilterField, string> = {
  class: "Class", subject: "Subject", chapter: "Chapter", topic: "Topic", year: "Year", language: "Language",
};

/** Native selects: best mobile pickers, zero extra JS. `idPrefix` keeps ids unique when rendered in two places. */
export function FilterFields({ fields, options, value, onChange, idPrefix }: {
  fields: FilterField[]; options: Record<FilterField, string[]>; value: Filters;
  onChange: (patch: Partial<Filters>) => void; idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      {fields.map((k) => (
        <div key={k}>
          <label htmlFor={`${idPrefix}-${k}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{FILTER_LABELS[k]}</label>
          <select id={`${idPrefix}-${k}`} value={value[k]} onChange={(e) => onChange({ [k]: e.target.value } as Partial<Filters>)}
            className="h-11 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm">
            <option value="">All</option>
            {options[k].map((o) => <option key={o} value={o}>{k === "class" && /^\d+$/.test(o) ? `Class ${o}` : o}</option>)}
            {value[k] && !options[k].includes(value[k]) && <option value={value[k]}>{value[k]}</option>}
          </select>
        </div>
      ))}
    </div>
  );
}
