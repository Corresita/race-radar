"use client";

import { useEffect, useState } from "react";

type RegistrationCountdownProps = {
  registrationOpens: string | null;
  registrationCloses: string | null;
  status: string;
};

const HOUR_MS = 1000 * 60 * 60;
const DAY_MS = HOUR_MS * 24;

function formatRemaining(remainingMs: number) {
  const days = Math.floor(remainingMs / DAY_MS);
  const hours = Math.floor((remainingMs % DAY_MS) / HOUR_MS);
  return `${days}d ${hours}h`;
}

export function RegistrationCountdown({
  registrationOpens,
  registrationCloses,
  status,
}: RegistrationCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000 * 60);
    return () => window.clearInterval(timer);
  }, []);

  if (status === "completed") {
    return <p className="mt-1 text-xs text-zinc-500">Race completed</p>;
  }

  const opensTime = registrationOpens ? new Date(registrationOpens).getTime() : NaN;
  const closesTime = registrationCloses ? new Date(registrationCloses).getTime() : NaN;

  if (!Number.isNaN(opensTime) && opensTime > now) {
    return (
      <p className="mt-1 text-xs font-medium text-emerald-700">
        Opens in {formatRemaining(opensTime - now)}
      </p>
    );
  }

  if (!Number.isNaN(closesTime)) {
    if (closesTime <= now) {
      return <p className="mt-1 text-xs text-zinc-500">Registration closed</p>;
    }
    return (
      <p className="mt-1 text-xs text-zinc-600">
        {formatRemaining(closesTime - now)} left to register
      </p>
    );
  }

  return <p className="mt-1 text-xs text-zinc-500">Registration dates TBA</p>;
}
