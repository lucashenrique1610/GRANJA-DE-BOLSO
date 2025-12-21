import { Badge } from "@/components/ui/badge"
import { Check, AlertTriangle, AlertCircle, Clock } from "lucide-react"

type StatusType = "success" | "warning" | "error" | "info" | "pending" | "low" | "medium" | "high" | "adequate" | string

interface StatusBadgeProps {
  status: StatusType
  text?: string
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ status, text, showIcon = true, className = "" }: StatusBadgeProps) {
  // Mapear status para variantes de badge
  const getVariant = () => {
    switch (status.toLowerCase()) {
      case "success":
      case "adequate":
      case "adequado":
      case "concluído":
      case "ativo":
        return "success"

      case "warning":
      case "medium":
      case "médio":
      case "alto":
      case "high":
        return "warning"

      case "error":
      case "low":
      case "baixo":
      case "atrasado":
        return "destructive"

      case "pending":
      case "info":
        return "secondary"

      default:
        return "outline"
    }
  }

  // Obter ícone baseado no status
  const getIcon = () => {
    switch (status.toLowerCase()) {
      case "success":
      case "adequate":
      case "adequado":
      case "concluído":
      case "ativo":
        return <Check className="h-3 w-3 mr-1" />

      case "warning":
      case "medium":
      case "médio":
      case "alto":
      case "high":
        return <AlertTriangle className="h-3 w-3 mr-1" />

      case "error":
      case "low":
      case "baixo":
      case "atrasado":
        return <AlertCircle className="h-3 w-3 mr-1" />

      case "pending":
        return <Clock className="h-3 w-3 mr-1" />

      default:
        return null
    }
  }

  // Obter texto a ser exibido
  const getDisplayText = () => {
    if (text) return text

    switch (status.toLowerCase()) {
      case "success":
      case "adequate":
      case "adequado":
        return "Adequado"

      case "warning":
      case "medium":
      case "médio":
      case "alto":
      case "high":
        return "Alto"

      case "error":
      case "low":
      case "baixo":
        return "Baixo"

      case "pending":
        return "Pendente"

      default:
        return status
    }
  }

  return (
    <Badge variant={getVariant()} className={`flex items-center ${className}`}>
      {showIcon && getIcon()}
      {getDisplayText()}
    </Badge>
  )
}
