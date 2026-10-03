export async function runWorkflow(payload: Record<string, unknown>) {
  let response: Response;
  try {
    response = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch {
    throw new Error("Could not reach the server. Your entries are unchanged; check your connection and retry.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "The action could not be completed. Refresh the record and retry.");
  return data;
}
