"use client";

import { useEffect, useState } from "react";

import { formatCountdown } from "@/presentation/lib";

export function Countdown({ closesAt }: { closesAt: string }) {
  const [value, setValue] = useState(() => formatCountdown(closesAt));

  useEffect(() => {
    const timer = setInterval(() => setValue(formatCountdown(closesAt)), 1000);
    return () => clearInterval(timer);
  }, [closesAt]);

  return <div className="countdown mono">{value}</div>;
}
