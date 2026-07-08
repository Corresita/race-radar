"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

type SaveState = {
  loading: boolean;
  error: string;
  success: boolean;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900";

export default function AdminPage() {
  const router = useRouter();
  const [saveState, setSaveState] = useState<SaveState>({
    loading: false,
    error: "",
    success: false,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState({ loading: true, error: "", success: false });

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      series: String(formData.get("series") ?? "").trim(),
      country: String(formData.get("country") ?? "").trim(),
      raceDate: String(formData.get("raceDate") ?? "").trim(),
      registrationOpens: String(formData.get("registrationOpens") ?? "").trim(),
      registrationCloses: String(formData.get("registrationCloses") ?? "").trim(),
      entryRequirement: String(formData.get("entryRequirement") ?? "").trim(),
      distances: String(formData.get("distances") ?? "").trim(),
      officialUrl: String(formData.get("officialUrl") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/races", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to save race");
      }

      setSaveState({ loading: false, error: "", success: true });

      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } catch (error) {
      setSaveState({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-16 sm:px-10">
      <header className="mb-10 border-b border-zinc-200 pb-7">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight text-zinc-900 sm:text-4xl">
          Add Race
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8"
      >
        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-zinc-500 uppercase">Race Name</span>
          <input name="name" required className={inputClass} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-zinc-500 uppercase">Series</span>
          <select name="series" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select a series
            </option>
            <option value="UTMB World Series">UTMB World Series</option>
            <option value="World Trail Majors">World Trail Majors</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-zinc-500 uppercase">Country</span>
          <input name="country" placeholder="e.g. France" className={inputClass} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-zinc-500 uppercase">Race Date</span>
          <input name="raceDate" type="date" required className={inputClass} />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-wide text-zinc-500 uppercase">
              Registration Opens
            </span>
            <input name="registrationOpens" type="date" className={inputClass} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-wide text-zinc-500 uppercase">
              Registration Closes
            </span>
            <input name="registrationCloses" type="date" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-zinc-500 uppercase">
            Entry Requirement
          </span>
          <input
            name="entryRequirement"
            placeholder="e.g. UTMB Index 100K"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-zinc-500 uppercase">Distances</span>
          <input
            name="distances"
            placeholder="e.g. 20K, 50K, 100K, 100M"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-zinc-500 uppercase">Official URL</span>
          <input
            name="officialUrl"
            type="url"
            required
            placeholder="https://"
            className={inputClass}
          />
        </label>

        <div className="flex items-center justify-between pt-3">
          <Link
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            href="/"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveState.loading}
            className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState.loading ? "Saving..." : "Save race"}
          </button>
        </div>

        {saveState.error ? (
          <p className="text-sm text-red-600">{saveState.error}</p>
        ) : null}
        {saveState.success ? (
          <p className="text-sm text-emerald-600">Success. Redirecting to calendar...</p>
        ) : null}
      </form>
    </main>
  );
}
