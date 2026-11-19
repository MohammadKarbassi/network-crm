import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/app/logo";
import { getCurrentUser } from "@/server/auth/session";
import { LoginForm } from "./login-form";
import { PipelineMotif } from "./pipeline-motif";

export const metadata: Metadata = { title: "ورود" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="grid min-h-svh flex-1 lg:grid-cols-[minmax(26rem,1fr)_1.15fr]">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="stagger mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-bold tracking-tight">ورود به نتورک</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            شماره موبایلی را که مدیر سیستم برایتان ثبت کرده وارد کنید؛ کد ورود پیامک می‌شود.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">حساب ندارید؟ از مدیر فروش یا ادمین شرکت بخواهید شما را به تیم اضافه کند.</p>
      </section>

      <aside className="relative hidden overflow-hidden bg-[oklch(0.21_0.02_220)] text-[oklch(0.96_0.01_196)] lg:flex lg:flex-col lg:justify-end">
        <PipelineMotif className="absolute inset-0 size-full" />
        <div className="stagger relative max-w-md p-12 [&>*]:[animation-duration:600ms]">
          <p className="text-2xl leading-10 font-semibold">یادداشت تماس را بنویسید؛ نتورک قدم بعدی را پیشنهاد می‌دهد.</p>
          <p className="mt-3 text-sm leading-6 text-[oklch(0.8_0.02_196)]">
            لید، معامله، تسک و پیگیری خودکار، همه در یک جا و به زبان خودتان.
          </p>
        </div>
      </aside>
    </main>
  );
}
