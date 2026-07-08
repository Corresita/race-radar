import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type RaceStatus = "announced" | "reg_open" | "reg_closed" | "sold_out" | "completed";

type RaceRecord = {
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

type NewRacePayload = {
  name?: string;
  series?: string;
  country?: string;
  raceDate?: string;
  registrationOpens?: string;
  registrationCloses?: string;
  entryRequirement?: string;
  officialUrl?: string;
  distances?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseOptionalDate(input: string | undefined, endOfDay: boolean): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;

  const parsed = new Date(endOfDay ? `${trimmed}T23:59:59` : `${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function deriveStatus(
  registrationOpens: string | null,
  registrationCloses: string | null,
  raceDate: string,
): RaceStatus {
  const now = Date.now();
  if (new Date(raceDate).getTime() < now) return "completed";
  if (registrationCloses && new Date(registrationCloses).getTime() < now) return "reg_closed";
  if (registrationOpens && new Date(registrationOpens).getTime() <= now) return "reg_open";
  return "announced";
}

export async function POST(request: Request) {
  let body: NewRacePayload;

  try {
    body = (await request.json()) as NewRacePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const series = body.series?.trim() ?? "";
  const raceDateInput = body.raceDate?.trim() ?? "";
  const officialUrl = body.officialUrl?.trim() ?? "";

  if (!name || !series || !raceDateInput || !officialUrl) {
    return NextResponse.json(
      { error: "Name, series, race date, and official URL are required" },
      { status: 400 },
    );
  }

  const raceDate = parseOptionalDate(raceDateInput, false);
  if (!raceDate) {
    return NextResponse.json({ error: "Invalid race date" }, { status: 400 });
  }

  const registrationOpens = parseOptionalDate(body.registrationOpens, false);
  const registrationCloses = parseOptionalDate(body.registrationCloses, true);

  try {
    new URL(officialUrl);
  } catch {
    return NextResponse.json({ error: "Official URL is invalid" }, { status: 400 });
  }

  const distances = (body.distances ?? "")
    .split(/[,/|]+/)
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  const id = `${slugify(name)}-${raceDateInput.slice(0, 4)}`;

  const racesPath = path.join(process.cwd(), "data", "races.json");
  const racesRaw = await readFile(racesPath, "utf-8");
  const races = JSON.parse(racesRaw) as RaceRecord[];

  if (races.some((race) => race.id === id)) {
    return NextResponse.json(
      { error: "A race with the same name and year already exists" },
      { status: 409 },
    );
  }

  const newRace: RaceRecord = {
    id,
    name,
    series,
    country: body.country?.trim() || null,
    raceDate,
    registrationOpens,
    registrationCloses,
    entryMethod: null,
    entryRequirement: body.entryRequirement?.trim() || null,
    distances: distances.length > 0 ? distances : ["50K"],
    officialUrl,
    status: deriveStatus(registrationOpens, registrationCloses, raceDate),
  };

  races.push(newRace);
  await writeFile(racesPath, `${JSON.stringify(races, null, 2)}\n`, "utf-8");

  return NextResponse.json({ success: true, race: newRace }, { status: 201 });
}
