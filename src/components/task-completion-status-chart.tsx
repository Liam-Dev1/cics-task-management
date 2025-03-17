"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type BarChartData = {
  name: string
  onTime: number
  missedDeadline: number
}

interface TaskCompletionStatusChartProps {
  data: BarChartData[]
}

export function TaskCompletionStatusChart({ data }: TaskCompletionStatusChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: "Number of Tasks", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="onTime" name="Completed On/Before Time" fill="#8B2332" />
          <Bar dataKey="missedDeadline" name="Missed Deadline" fill="#1E1E1E" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

