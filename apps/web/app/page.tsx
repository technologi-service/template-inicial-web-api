import { apiServer } from "@/lib/api";

type HealthData = {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
};

async function getHealth() {
  try {
    const res = await apiServer().get<HealthData>("/health");
    return res.data;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Celta</h1>

      <div className="rounded-lg border p-6 w-full max-w-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          API Status
        </h2>
        {health ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium text-green-600">{health.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Version</dt>
              <dd className="font-mono">{health.version}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Uptime</dt>
              <dd className="font-mono">{health.uptime}s</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-red-500">API not reachable</p>
        )}
      </div>
    </main>
  );
}
