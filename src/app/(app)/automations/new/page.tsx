import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { automationTemplates } from "@/lib/automation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/auth/session";
import type { AutomationInput } from "../actions";
import { AutomationBuilder } from "../builder";

export const metadata: Metadata = { title: "اتوماسیون جدید" };

export default async function NewAutomationPage({ searchParams }: PageProps<"/automations/new">) {
  await requireUser(["ADMIN", "SALES_MANAGER"]);
  const template = automationTemplates[Number((await searchParams).template)];
  const initial: AutomationInput = template
    ? { name: template.name, trigger: template.trigger, triggerConfig: template.triggerConfig, steps: template.steps, isActive: true }
    : { name: "", trigger: "LEAD_CREATED", triggerConfig: {}, steps: [{ type: "SEND_SMS", body: "" }], isActive: true };
  return (
    <>
      <Button variant="link" asChild className="w-fit px-0 text-muted-foreground">
        <Link href="/automations">
          <ArrowRight /> اتوماسیون‌ها
        </Link>
      </Button>
      <PageHeader title={template ? `الگو: ${template.name}` : "اتوماسیون جدید"} description="رویداد شروع را انتخاب کنید و مرحله‌ها را به ترتیب بچینید." />
      <AutomationBuilder initial={initial} />
    </>
  );
}
