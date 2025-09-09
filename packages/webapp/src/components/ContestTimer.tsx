"use client"

import { useEffect, useState, useMemo } from "react"
import { useContest } from "@/hooks/useContest"

type ContestTimerProps = {
    time?: Date // Make optional since we'll get it from contest data
    isStart: boolean
}

export function ContestTimer({ time, isStart }: ContestTimerProps) {
    const { contest } = useContest()
    
    // Use dynamic timer from contest data or fallback to prop
    const timerDate = useMemo(() => {
        // Determine which timer to show based on contest status and isStart prop
        if (contest) {
            if (isStart && contest.battleStartTime) {
                // Show "Battle starts in" timer
                return new Date(contest.battleStartTime)
            } else if (!isStart && contest.battleEndTime) {
                // Show "Battle ends in" timer
                return new Date(contest.battleEndTime)
            }
        }
        return time || new Date(Date.now() + 60 * 60 * 1000) // 1 hour fallback
    }, [contest, isStart, time])
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Date.now()
            const contestTime = timerDate.getTime()
            const difference = contestTime - now

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((difference % (1000 * 60)) / 1000)

                setTimeLeft({ days, hours, minutes, seconds })
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)

        return () => clearInterval(timer)
    }, [timerDate])

    const formatTime = (value: number) => value.toString().padStart(2, "0")

    return (
        <div className="rounded-2xl p-[6px] relative">
            <div
                className="absolute inset-0 rounded-2xl z-0"
                style={{
                    background:
                        "linear-gradient(33deg, #C3C3C3 0%, #DCDCDC 15%, #FDFEFE 36%, #9A9A9A 58%, #B2B2B2 79%, #B0B0B0 100%)",
                }}
            />
            <div className="relative z-10 rounded-2xl overflow-hidden">
                <div
                    className="text-center py-2"
                    style={{
                        background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
                    }}
                >
                    <h3 className="text-sm font-bold" style={{ color: "#124D04" }}>
                        Battle {isStart ? "starts" : "ends"} in:
                    </h3>
                </div>

                <div className="bg-white px-3 py-4 rounded-b-2xl">
                    <div className="flex items-center justify-center text-center font-dela-gothic-one mx-auto max-w-md">
                        <div className="flex-1 flex flex-col gap-2">
                            <span className="text-4xl text-black opacity-25">{formatTime(timeLeft.days)}</span>
                            <span className="text-xs font-semibold font-schibsted-grotesk" style={{ color: "#161616" }}>
                                DAYS
                            </span>
                        </div>

                        <span className="text-3xl text-black opacity-25 mx-1 pb-4">:</span>

                        <div className="flex-1 flex flex-col gap-2">
                            <span className="text-4xl text-black opacity-25">{formatTime(timeLeft.hours)}</span>
                            <span className="text-xs font-semibold font-schibsted-grotesk" style={{ color: "#161616" }}>
                                HOURS
                            </span>
                        </div>

                        <span className="text-3xl text-black opacity-25 mx-1 pb-4">:</span>

                        <div className="flex-1 flex flex-col gap-2">
                            <span className="text-4xl text-black opacity-25">{formatTime(timeLeft.minutes)}</span>
                            <span className="text-xs font-semibold font-schibsted-grotesk" style={{ color: "#161616" }}>
                                MINUTES
                            </span>
                        </div>

                        <span className="text-3xl text-black opacity-25 mx-1 pb-4">:</span>

                        <div className="flex-1 flex flex-col gap-2">
                            <span className="text-4xl text-black opacity-25">{formatTime(timeLeft.seconds)}</span>
                            <span className="text-xs font-semibold font-schibsted-grotesk" style={{ color: "#161616" }}>
                                SECONDS
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
