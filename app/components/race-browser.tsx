"use client";

import { useMemo, useState } from "react";
import { RegistrationCountdown } from "@/app/components/deadline-countdown";

export type RaceStatus =
  | "announced"
  | "reg_open"
  | "reg_closed"
  | "sold_out"
  | "completed";

export type Race = {
  id: string;
  name: string;
  series: string;
  country: string | null;
  raceDate: string;
  registrationOpens: string | null;
  registrationCloses: string | null;
  entryMethod: "lottery" | "first-come" | "qualification" | null;
  entryRequirement: string | null;
  distances: string[];
  officialUrl: string;
  status: RaceStatus;
};

type RaceBrowserProps = {
  races: Race[];
};

const seriesTabs = ["UTMB World Series", "World Trail Majors"] as const;

const statusLabels: Record<RaceStatus, string> = {
  announced: "Announced",
  reg_open: "Registration Open",
  reg_closed: "Registration Closed",
  sold_out: "Sold Out",
  completed: "Completed",
};

const badgeStyles: Record<RaceStatus, string> = {
  reg_open: "border-emerald-500/40 text-emerald-700 bg-emerald-50",
  announced: "border-amber-500/40 text-amber-700 bg-amber-50",
  reg_closed: "border-zinc-300 text-zinc-600 bg-zinc-100",
  sold_out: "border-red-300 text-red-700 bg-red-50",
  completed: "border-zinc-300 text-zinc-500 bg-zinc-100",
};

const entryMethodLabels: Record<string, string> = {
  lottery: "Lottery",
  "first-come": "First come, first served",
  qualification: "Qualification",
};

function formatRaceDate(isoDate: string) {
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) return "TBD";

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRegistrationDate(isoDate: string | null) {
  if (!isoDate) return "TBA";
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) return "TBA";

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RaceBrowser({ races }: RaceBrowserProps) {
  const [activeSeries, setActiveSeries] =
    useState<(typeof seriesTabs)[number]>("UTMB World Series");
  const [activeDistance, setActiveDistance] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const trailDistanceFilters = ["20K", "50K", "100K", "100M"];

  const visibleRaces = useMemo(() => {
    return races.filter((race) => {
      if (race.series !== activeSeries) return false;
      if (!showCompleted && race.status === "completed") return false;
      if (activeDistance && !race.distances.includes(activeDistance)) return false;
      return true;
    });
  }, [races, activeSeries, activeDistance, showCompleted]);

  return (
    <>
      <section className="mb-4 flex flex-wrap gap-2">
        {seriesTabs.map((series) => (
          <button
            key={series}
            type="button"
            onClick={() => {
              setActiveSeries(series);
              setActiveDistance(null);
            }}
            className={`rounded-full border px-4 py-1.5 text-xs tracking-wide uppercase transition-colors ${
              activeSeries === series
                ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900"
            }`}
          >
            {series}
          </button>
        ))}
      </section>

      <section className="mb-8 flex flex-wrap items-center gap-2">
        {trailDistanceFilters.map((distance) => (
          <button
            key={distance}
            type="button"
            onClick={() =>
              setActiveDistance((currentDistance) =>
                currentDistance === distance ? null : distance,
              )
            }
            className={`rounded-full border px-4 py-1.5 text-xs tracking-wide uppercase transition-colors ${
              activeDistance === distance
                ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900"
            }`}
          >
            {distance}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCompleted((current) => !current)}
          className={`ml-auto rounded-full border px-4 py-1.5 text-xs tracking-wide uppercase transition-colors ${
            showCompleted
              ? "border-zinc-900 bg-zinc-900 text-zinc-50"
              : "border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900"
          }`}
        >
          {showCompleted ? "Hide past races" : "Show past races"}
        </button>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <ul className="divide-y divide-zinc-200">
          {visibleRaces.map((race) => (
            <li
              key={race.id}
              className="grid gap-3 px-5 py-5 sm:grid-cols-[1.35fr_1fr_1fr] sm:gap-4 sm:px-7"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium tracking-tight text-zinc-900">{race.name}</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] uppercase ${badgeStyles[race.status]}`}
                  >
                    {statusLabels[race.status]}
                  </span>
                </div>
                <a
                  className="mt-1 inline-flex text-sm text-zinc-600 transition-colors hover:text-zinc-900"
                  href={race.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official site
                </a>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500 uppercase">
                  {race.series}
                  {race.country ? ` · ${race.country}` : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {race.distances.map((distance) => (
                    <span
                      key={`${race.id}-${distance}`}
                      className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] tracking-wide text-zinc-700 uppercase"
                    >
                      {distance}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs tracking-wide text-zinc-500 uppercase">Race Date</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {formatRaceDate(race.raceDate)}
                </p>
                {race.entryMethod ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Entry: {entryMethodLabels[race.entryMethod] ?? race.entryMethod}
                  </p>
                ) : null}
                {race.entryRequirement ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Requires: {race.entryRequirement}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-xs tracking-wide text-zinc-500 uppercase">Registration</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {formatRegistrationDate(race.registrationOpens)} –{" "}
                  {formatRegistrationDate(race.registrationCloses)}
                </p>
                <RegistrationCountdown
                  registrationOpens={race.registrationOpens}
                  registrationCloses={race.registrationCloses}
                  status={race.status}
                />
              </div>
            </li>
          ))}
        </ul>

        {visibleRaces.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-500 sm:px-7">
            {activeSeries} 当前暂无符合筛选条件的比赛。
          </p>
        ) : null}
      </section>
    </>
  );
}
