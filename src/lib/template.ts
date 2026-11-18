/** Fills {{name}} / {{company}} placeholders. Unknown or empty fields become "". */
export const fillTemplate = (template: string, vars: Record<string, string | null | undefined>) =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");

export const TEMPLATE_HINT = "از {{name}} برای نام و {{company}} برای شرکت استفاده کنید.";
