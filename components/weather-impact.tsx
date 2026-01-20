
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Thermometer, Droplets, Wind, AlertTriangle, CheckCircle } from "lucide-react"

interface WeatherImpactProps {
  temp: number
  humidity: number
  windKmh: number
}

export function WeatherImpact({ temp, humidity, windKmh }: WeatherImpactProps) {
  const getImpacts = () => {
    const impacts = []

    // Temperatura
    if (temp >= 30) {
      impacts.push({
        type: "danger",
        title: "Estresse Calórico Alto",
        desc: "Risco de mortalidade. Ative ventiladores e nebulizadores imediatamente.",
        icon: <Thermometer className="h-4 w-4" />
      })
    } else if (temp >= 26) {
      impacts.push({
        type: "warning",
        title: "Atenção Térmica",
        desc: "Temperatura elevada. Monitore o comportamento das aves.",
        icon: <Thermometer className="h-4 w-4" />
      })
    } else if (temp <= 15) {
      impacts.push({
        type: "warning",
        title: "Baixa Temperatura",
        desc: "Risco de amontoamento. Verifique o aquecimento e feche cortinas.",
        icon: <Thermometer className="h-4 w-4" />
      })
    }

    // Umidade
    if (humidity >= 80) {
      impacts.push({
        type: "warning",
        title: "Umidade Alta",
        desc: "Risco de cama úmida e proliferação de amônia. Melhore a ventilação.",
        icon: <Droplets className="h-4 w-4" />
      })
    } else if (humidity <= 30) {
      impacts.push({
        type: "warning",
        title: "Umidade Baixa",
        desc: "Risco de poeira e problemas respiratórios.",
        icon: <Droplets className="h-4 w-4" />
      })
    }

    // Vento
    if (windKmh >= 20) {
      impacts.push({
        type: "warning",
        title: "Vento Forte",
        desc: "Proteja cortinas externas e verifique fixação do telhado.",
        icon: <Wind className="h-4 w-4" />
      })
    }

    if (impacts.length === 0) {
      impacts.push({
        type: "success",
        title: "Condições Ideais",
        desc: "Clima favorável para a produção.",
        icon: <CheckCircle className="h-4 w-4" />
      })
    }

    return impacts
  }

  const impacts = getImpacts()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Análise de Impacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {impacts.map((impact, idx) => (
          <Alert key={idx} variant={impact.type === "danger" ? "destructive" : "default"} className={impact.type === "success" ? "border-green-500 bg-green-50/50" : impact.type === "warning" ? "border-amber-500 bg-amber-50/50" : ""}>
            <div className="flex items-center gap-2">
              {impact.icon}
              <AlertTitle>{impact.title}</AlertTitle>
            </div>
            <AlertDescription>
              {impact.desc}
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
