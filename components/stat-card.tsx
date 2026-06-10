import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import { formatNumber, formatCurrency, formatPercent } from "@/lib/format-utils"

interface StatCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  change?: number
  formatter?: "number" | "currency" | "percent" | "none"
  trend?: "up" | "down" | "neutral"
  trendText?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  change,
  formatter = "number",
  trend,
  trendText,
  className = "",
}: StatCardProps) {
  // Formatar o valor de acordo com o tipo
  const formattedValue = () => {
    if (typeof value === "string") return value

    switch (formatter) {
      case "number":
        return formatNumber(value)
      case "currency":
        return formatCurrency(value)
      case "percent":
        return formatPercent(value, 1)
      case "none":
      default:
        return value.toString()
    }
  }

  // Determinar o ícone de tendência
  const trendIcon = () => {
    if (trend === "up") return <ArrowUp className="h-4 w-4" />
    if (trend === "down") return <ArrowDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  // Determinar a cor da tendência
  const trendColor = () => {
    if (trend === "up") return "text-emerald-500"
    if (trend === "down") return "text-red-500"
    return "text-gray-500"
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <div className="text-2xl font-bold">{formattedValue()}</div>
          </div>

          {(trend || change !== undefined) && (
            <div className={`flex items-center gap-1 ${trendColor()}`}>
              {trendIcon()}
              <span className="text-xs">{trendText || (change !== undefined ? `${Math.abs(change)}%` : "")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
