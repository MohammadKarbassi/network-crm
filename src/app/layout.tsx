import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "نتورک CRM", template: "%s | نتورک" },
  description: "مدیریت مشتری، لید و فروش",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DirectionProvider dir="rtl">
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" richColors />
        </DirectionProvider>
      </body>
    </html>
  );
}
