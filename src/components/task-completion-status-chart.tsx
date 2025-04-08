import type { ReactNode } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export interface TaskCompletionStatusChartProps {
  data: Array<{
    name: string
    onTime: number
    missedDeadline: number
    startDate?: string
    endDate?: string
  }>
  children?: ReactNode
}

export function TaskCompletionStatusChart({ data, children }: TaskCompletionStatusChartProps) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickCount={10}/>
          {children || <Tooltip />}
          <Bar dataKey="onTime" name="Completed On/Before Time" fill="#8B2332" />
          <Bar dataKey="missedDeadline" name="Missed Deadline" fill="#4A5568" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

