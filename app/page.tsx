import { RaceBrowser, type Race } from "@/app/components/race-browser";
import races from "@/data/races.json";

export const dynamic = "force-dynamic";

// Static import so the data ships inside the serverless bundle; a runtime
// readFile would not be traced into the deployment output.
const raceData = races as unknown as Race[];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10">
      {/* Server components run once per request, so this is a stable
          per-request timestamp; the client reuses it during hydration. */}
      {/* eslint-disable-next-line react-hooks/purity */}
      <RaceBrowser races={raceData} initialNow={Date.now()} />

      <footer className="mt-6 text-xs text-zinc-500">
        Race data is manually curated. Always confirm dates on the official
        race website before planning.
      </footer>
    </main>
  );
}
