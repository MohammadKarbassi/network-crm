/** Remounts on every top-level page change, so each page's sections rise in one after another. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="stagger flex flex-1 flex-col gap-5">{children}</div>;
}
