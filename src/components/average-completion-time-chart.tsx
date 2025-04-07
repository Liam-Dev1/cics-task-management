"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type LineChartData = {
  name: string
  value: number
}

interface AverageCompletionTimeChartProps {
  data: LineChartData[]
}

export function AverageCompletionTimeChart({ data }: AverageCompletionTimeChartProps) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
          <YAxis ticks={[0,10,20,30,40,50,60,70,80,90,100]} label={{ value: "Completion Time (%)", angle: -90, position: "insideLeft" }} domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, "Avg. Completion Time"]} />
          <Legend />
          <Line
            type="linear"
            dataKey="value"
            name="Average Completion Time"
            stroke="#8B2332"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

