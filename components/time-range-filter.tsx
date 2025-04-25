"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type TimeRange = "1h" | "1d" | "1w" | "1m" | "all"

interface TimeRangeFilterProps {
    value: TimeRange
    onChange: (value: TimeRange) => void
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
    return (
        <Tabs
            value={value}
            onValueChange={(val) => onChange(val as TimeRange)}
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="1h">Uur</TabsTrigger>
                <TabsTrigger value="1d">Dag</TabsTrigger>
                <TabsTrigger value="1w">Week</TabsTrigger>
                <TabsTrigger value="1m">Maand</TabsTrigger>
                <TabsTrigger value="all">Alles</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
