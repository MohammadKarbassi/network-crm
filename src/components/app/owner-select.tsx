import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type OwnerOption = { id: string; name: string };

/** Sales rep picker. "none" = unassigned, "all" = no filter (filter mode only). */
export function OwnerSelect({
  owners,
  defaultValue,
  name = "ownerId",
  mode = "assign",
}: {
  owners: OwnerOption[];
  defaultValue?: string | null;
  name?: string;
  mode?: "assign" | "filter";
}) {
  return (
    <Select name={name} defaultValue={defaultValue ?? (mode === "filter" ? "all" : "none")}>
      <SelectTrigger className="w-full" aria-label="کارشناس">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {mode === "filter" && <SelectItem value="all">همه کارشناس‌ها</SelectItem>}
        <SelectItem value="none">{mode === "filter" ? "بدون کارشناس" : "بدون تخصیص"}</SelectItem>
        {owners.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
