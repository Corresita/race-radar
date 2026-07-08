import { load } from "cheerio";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type RaceRecord = {
  id: string;
  name: string;
  raceDate: string;
  registrationOpens: string | null;
  registrationCloses: string | null;
  officialUrl: string;
  status: string;
};

type ScrapeConfig = {
  raceId: string;
  url: string;
  selectors: string[];
};

const DEFAULT_CONFIG: ScrapeConfig = {
  // Simple starter target: static event-style page text.
  raceId: "eiger-ultra-trail-2026",
  url: "https://www.runvan.org/first-half/",
  selectors: [
    "main",
    "article",
    ".entry-content",
    ".content",
    "body",
  ],
};

const MONTH_DATE_REGEX =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?\b/i;
const ISO_REGEX = /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2})?)?\b/;
const KEYWORD_CONTEXT_REGEX =
  /(.{0,100}(registration|register|deadline|entries close|entry closes|closing date).{0,140})/gi;

function getArg(flag: string): string | undefined {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalizeToIso(dateText: string): string | null {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function extractDeadlineText(html: string, selectors: string[]): string | null {
  const $ = load(html);
  const chunks: string[] = [];

  for (const selector of selectors) {
    const text = $(selector).first().text().replace(/\s+/g, " ").trim();
    if (text) chunks.push(text);
  }

  const searchableText = chunks.join(" ");
  const contexts = Array.from(searchableText.matchAll(KEYWORD_CONTEXT_REGEX)).map(
    (match) => match[1],
  );

  for (const context of contexts) {
    const dateInContext = context.match(MONTH_DATE_REGEX)?.[0] ?? context.match(ISO_REGEX)?.[0];
    if (dateInContext) {
      return dateInContext;
    }
  }

  // Fallback for pages that do not include explicit deadline keywords.
  return searchableText.match(MONTH_DATE_REGEX)?.[0] ?? searchableText.match(ISO_REGEX)?.[0] ?? null;
}

async function updateRaceDeadline(raceId: string, isoDeadline: string, write: boolean) {
  const racesPath = path.join(process.cwd(), "data", "races.json");
  const current = await readFile(racesPath, "utf-8");
  const races = JSON.parse(current) as RaceRecord[];

  const target = races.find((race) => race.id === raceId);
  if (!target) {
    throw new Error(`Race with id "${raceId}" not found in data/races.json`);
  }

  const previousDeadline = target.registrationCloses;
  target.registrationCloses = isoDeadline;

  if (write) {
    await writeFile(racesPath, `${JSON.stringify(races, null, 2)}\n`, "utf-8");
  }

  return { previousDeadline, nextDeadline: isoDeadline };
}

async function main() {
  const raceId = getArg("--raceId") ?? DEFAULT_CONFIG.raceId;
  const url = getArg("--url") ?? DEFAULT_CONFIG.url;
  const selectorArg = getArg("--selectors");
  const selectors = selectorArg
    ? selectorArg.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_CONFIG.selectors;
  const write = hasFlag("--write");

  const response = await fetch(url, {
    headers: {
      "user-agent": "race-radar-scraper/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const foundText = extractDeadlineText(html, selectors);

  if (!foundText) {
    throw new Error("Could not detect a registration deadline on the page.");
  }

  const isoDeadline = normalizeToIso(foundText);
  if (!isoDeadline) {
    throw new Error(`Detected deadline text "${foundText}" but could not parse into a date.`);
  }

  const { previousDeadline, nextDeadline } = await updateRaceDeadline(raceId, isoDeadline, write);

  console.log(`Scraped from: ${url}`);
  console.log(`Detected deadline text: ${foundText}`);
  console.log(`Race id: ${raceId}`);
  console.log(`Old deadline: ${previousDeadline}`);
  console.log(`New deadline: ${nextDeadline}`);
  console.log(write ? "Updated data/races.json" : "Dry run only. Add --write to persist.");
}

main().catch((error) => {
  console.error("Scrape failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
