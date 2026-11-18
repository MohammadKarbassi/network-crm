"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { writeMessageAction } from "@/app/(app)/ai/actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

/** "Write with AI": the user states the goal, the model drafts subject/body with {{name}} placeholders. */
export function AiWriteButton({ channel, onWrite }: { channel: "SMS" | "EMAIL"; onWrite: (m: { subject: string | null; body: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [pending, startTransition] = useTransition();
  const write = () =>
    startTransition(async () => {
      const res = await writeMessageAction(goal, channel);
      if (!res.ok) return void toast.error(res.error);
      onWrite(res.data);
      setOpen(false);
    });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles /> نوشتن با هوش مصنوعی
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-80 flex-col gap-2" align="start">
        <label htmlFor="ai-goal" className="text-sm font-medium">
          هدف پیام چیست؟
        </label>
        <Textarea
          id="ai-goal"
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="مثلاً: دعوت مشتری‌های قدیمی به وبینار معرفی نسخهٔ جدید، پنجشنبه ساعت ۱۰"
        />
        <Button type="button" onClick={write} disabled={pending || goal.trim().length < 5}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "در حال نوشتن…" : "پیش‌نویس کن"}
        </Button>
        <p className="text-xs text-muted-foreground">متن پیشنهادی در فرم قرار می‌گیرد و قبل از ارسال قابل ویرایش است.</p>
      </PopoverContent>
    </Popover>
  );
}
