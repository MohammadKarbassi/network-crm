import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Select over an enum's Persian labels. `allLabel` adds an "all" option for filter forms. */
export function EnumSelect<T extends string>({
  name,
  labels,
  values,
  defaultValue,
  allLabel,
  ariaLabel,
}: {
  name: string;
  labels: Record<T, string>;
  values?: T[];
  defaultValue?: T;
  allLabel?: string;
  ariaLabel: string;
}) {
  const options = values ?? (Object.keys(labels) as T[]);
  return (
    <Select name={name} defaultValue={defaultValue ?? (allLabel ? "all" : options[0])}>
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
        {options.map((v) => (
          <SelectItem key={v} value={v}>
            {labels[v]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
