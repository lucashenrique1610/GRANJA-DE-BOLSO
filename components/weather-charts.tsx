
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface HourlyData {
  time: string
  temp: number
}

interface WeatherChartsProps {
  data: HourlyData[]
}

export function WeatherCharts({ data }: WeatherChartsProps) {
  const chartData = data.slice(0, 24).map(d => ({
    time: d.time.includes(":") ? d.time : d.time, 
    temp: d.temp
  }))

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Tendência de Temperatura (Próximas 24h)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              tick={{fontSize: 12, fill: "#6b7280"}} 
              tickLine={false}
              axisLine={false}
              interval={3} 
            />
            <YAxis 
              unit="°C" 
              domain={['dataMin - 2', 'dataMax + 2']} 
              tick={{fontSize: 12, fill: "#6b7280"}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#f59e0b' }}
              labelStyle={{ color: '#374151' }}
            />
            <Area 
              type="monotone" 
              dataKey="temp" 
              stroke="#f59e0b" 
              fillOpacity={1} 
              fill="url(#colorTemp)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
