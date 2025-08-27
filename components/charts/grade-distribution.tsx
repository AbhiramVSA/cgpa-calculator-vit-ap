"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"

type Course = { grade: string }

const COLORS: Record<string, string> = {
    S: "#10b981",
    A: "#3b82f6",
    B: "#f59e0b",
    C: "#f97316",
    D: "#ef4444",
    E: "#ef4444",
    F: "#b91c1c",
    P: "#6b7280",
}

export function GradeDistribution({ courses }: { courses: Course[] }) {
    const counts = courses.reduce<Record<string, number>>((acc, c) => {
        acc[c.grade] = (acc[c.grade] || 0) + 1
        return acc
    }, {})

    const data = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => (a.name > b.name ? 1 : -1))

    if (data.length === 0) return null

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer>
                <PieChart>
                    <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(val, name) => [String(val), `Grade ${name}`]} />
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] ?? "#94a3b8"} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
