"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type BarChartData = {
  name: string
  completed: number
  pending: number
  overdue: number
}

interface TaskCompletionBarChartProps {
  data: BarChartData[]
}

export function TaskCompletionBarChart({ data }: TaskCompletionBarChartProps) {
  return (
    <div className="h-100 w-full">
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
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" name="Completed Tasks" fill="#8B2332" />
          <Bar dataKey="pending" name="Pending Tasks" fill="#D9D9D9" />
          <Bar dataKey="overdue" name="Overdue Tasks" fill="#1E1E1E" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

