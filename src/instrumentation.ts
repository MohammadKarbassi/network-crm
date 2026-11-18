// Runs once per server start. The queue worker lives in the same process as the web app,
// so one Liara app is enough. Set RUN_WORKER=false to run web without the worker.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Day boundaries (today's tasks, month grid, "this week" stats) are Tehran days, even on a UTC server.
  process.env.TZ ??= "Asia/Tehran";
  if (process.env.RUN_WORKER === "false") return;
  const { startWorkers } = await import("@/server/queue/worker");
  startWorkers();
}
