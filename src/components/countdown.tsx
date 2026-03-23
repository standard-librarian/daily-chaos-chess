"use client";

import { useEffect, useState } from "react";

import { formatCountdown } from "@/presentation/lib";

export function Countdown({ closesAt }: { closesAt: string }) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setValue(formatCountdown(closesAt));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [closesAt]);

  return (
    <div className="countdown mono" suppressHydrationWarning>
      {value ?? "--:--:--"}
    </div>
  );
}
