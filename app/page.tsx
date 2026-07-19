import { RaceBrowser, type Race } from "@/app/components/race-browser";
import { deriveStatus } from "@/lib/deriveStatus";
import races from "@/data/races.json";

export const dynamic = "force-dynamic";

// Static import so the data ships inside the serverless bundle; a runtime
// readFile would not be traced into the deployment output.
const raceData = races as unknown as Race[];

const OPEN_CODES = new Set(["REG_OPEN", "REG_CLOSING_SOON", "LOTTERY_OPEN"]);
const CLOSED_CODES = new Set([
  "REG_CLOSED",
  "SOLD_OUT",
  "LOTTERY_DRAWN",
  "AWAITING_DRAW",
  "COMPLETED_NEXT_KNOWN",
  "COMPLETED_NEXT_TBA",
]);

export default function Home() {
  // Server components run once per request, so this is a stable
  // per-request timestamp; the client reuses it during hydration.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  const statuses = raceData.map((race) => deriveStatus(race, new Date(initialNow)));
  const openCount = statuses.filter((s) => OPEN_CODES.has(s.code)).length;
  const closedCount = statuses.filter((s) => CLOSED_CODES.has(s.code)).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10">
      <header className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-300 pb-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-zinc-900 uppercase">
              Race Reminder™
            </p>
            <p className="mt-2 max-w-xs text-[11px] leading-relaxed tracking-[0.08em] text-zinc-500 uppercase">
              Monitoring trail ultra registrations so you never miss a start
              line.
            </p>
          </div>
          <div className="flex gap-6 text-xs tracking-wide text-zinc-500 uppercase">
            <span>
              <span className="mr-1.5 font-semibold text-zinc-900">
                {raceData.length}
              </span>
              races
            </span>
            <span>
              <span className="mr-1.5 font-semibold text-zinc-900">
                {openCount}
              </span>
              open
            </span>
            <span>
              <span className="mr-1.5 font-semibold text-zinc-900">
                {closedCount}
              </span>
              closed
            </span>
          </div>
        </div>

        <h1 className="mt-10 text-4xl leading-[0.95] font-bold tracking-tight text-zinc-900 uppercase sm:text-6xl">
          Never miss
          <br />a trail ultra
          <br />
          registration.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-600 sm:text-base">
          Opening dates, deadlines, and lottery draws — sorted by what needs
          action next.
        </p>
      </header>

      <RaceBrowser races={raceData} initialNow={initialNow} />

      <footer className="mt-6 text-xs text-zinc-500">
        Race data is manually curated. Always confirm dates on the official
        race website before planning.
      </footer>
    </main>
  );
}
