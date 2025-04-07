"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

type PieChartData = {
  name: string
  value: number
  color: string
}

interface TaskCompletionPieChartProps {
  data: PieChartData[]
  title: string
  subtitle1: string
  subtitle2: string
  isQuadChart?: boolean
}

export function TaskCompletionPieChart({
  data,
  title,
  subtitle1,
  subtitle2,
  isQuadChart = false,
}: TaskCompletionPieChartProps) {
  // Filter out zero values for the pie chart only
  const filteredData = data.filter(item => item.value > 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Calculate total for percentage in tooltip
  const dataTotal = filteredData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={0}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={0}
              dataKey="value"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                `${value} (${((value / dataTotal) * 100).toFixed(1)}%)`
              }
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              payload={data.map((item, index) => ({
                value: item.name,
                type: 'square',
                id: index,
                color: item.color,
                payload: item
              }))}
              formatter={(value, entry, index) => (
                <span style={{ color: entry.color, fontWeight: 500 }}>
                  {value}{entry.payload.value === 0 ? '' : ''}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

