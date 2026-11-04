const seen = new Set<string>();

export async function enqueueEvent(webhookId: string, event: unknown): Promise<void> {
  if (seen.has(webhookId)) return;
  seen.add(webhookId);
  console.log('queued', webhookId);
}
