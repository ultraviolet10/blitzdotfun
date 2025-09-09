"use client";

import { useState, useEffect } from "react";

type PostingTimerProps = {
  time?: Date;
};

export function PostingTimer({ time }: PostingTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!time) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        return;
      }
      
      const now = new Date().getTime();
      const contestTime = time.getTime();
      const difference = contestTime - now;

      if (difference > 0) {
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ minutes, seconds });
      } else {
        setTimeLeft({ minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const formatTime = (value: number) => value.toString().padStart(2, "0");

  return (
    <div className="rounded-2xl p-[8px] mb-8 relative w-full max-w-[320px]">
      <div
        className="absolute inset-0 rounded-2xl z-0"
        style={{
          background:
            "linear-gradient(33deg, #C3C3C3 0%, #DCDCDC 15%, #FDFEFE 36%, #9A9A9A 58%, #B2B2B2 79%, #B0B0B0 100%)",
        }}
      />
      <div className="relative z-10 rounded-2xl overflow-hidden">
        <div className="bg-white px-4 py-6 rounded-b-2xl">
          <div className="flex items-center justify-center text-center font-dela-gothic-one">
            <div className="flex-1 flex flex-col gap-3">
              <span className="text-6xl text-black opacity-25">
                {formatTime(timeLeft.minutes)}
              </span>
              <span
                className="text-sm font-semibold font-schibsted-grotesk"
                style={{ color: "#161616" }}
              >
                MINUTES
              </span>
            </div>

            <span className="text-5xl text-black opacity-25 mx-2 pb-4">:</span>

            <div className="flex-1 flex flex-col gap-3">
              <span className="text-6xl text-black opacity-25">
                {formatTime(timeLeft.seconds)}
              </span>
              <span
                className="text-sm font-semibold font-schibsted-grotesk"
                style={{ color: "#161616" }}
              >
                SECONDS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
