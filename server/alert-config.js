// Configuração central de alertas/limiares (regra 9: alertas configuráveis).
// Onde integrar: os logs com level "alert" são consumidos por Vercel Log Drains
// (Sentry, Datadog, Grafana, etc.) e o degradar de /api/health sinaliza para
// uptime monitors externos (UptimeRobot, BetterStack) dispararem notificações.

export const ALERT_THRESHOLDS = {
  // Latência de requisição API (ms) acima da qual gera alerta de performance.
  httpLatencyMs: {
    warn: 1000,
    alert: 3000,
  },
  // After health deauth/db ficar indisponível por N verificações consecutivas.
  healthFailuresBeforeAlert: 3,
  // Taxa de hit do cache abaixo da qual gera alerta de eficiência (0-1).
  minCacheHitRate: 0.2,
  // Uso de heap (% do heap total) acima do qual gera alerta de memória.
  heapUsagePercent: {
    warn: 70,
    alert: 90,
  },
};

const thresholds = ALERT_THRESHOLDS;

export function evaluateAnomalies({
  durationMs,
  cacheHitRate,
  heapUsedBytes,
  heapTotalBytes,
} = {}) {
  const anomalies = [];

  if (durationMs != null) {
    if (durationMs >= thresholds.httpLatencyMs.alert) {
      anomalies.push({ type: 'latency_alert', severity: 'alert', valueMs: durationMs, thresholdMs: thresholds.httpLatencyMs.alert });
    } else if (durationMs >= thresholds.httpLatencyMs.warn) {
      anomalies.push({ type: 'latency_warn', severity: 'warn', valueMs: durationMs, thresholdMs: thresholds.httpLatencyMs.warn });
    }
  }

  if (cacheHitRate != null && cacheHitRate < thresholds.minCacheHitRate) {
    anomalies.push({ type: 'cache_hit_rate_low', severity: 'warn', hitRate: cacheHitRate, threshold: thresholds.minCacheHitRate });
  }

  if (heapUsedBytes != null && heapTotalBytes > 0) {
    const percent = (heapUsedBytes / heapTotalBytes) * 100;
    if (percent >= thresholds.heapUsagePercent.alert) {
      anomalies.push({ type: 'memory_alert', severity: 'alert', heapPercent: Number(percent.toFixed(1)), thresholdPercent: thresholds.heapUsagePercent.alert });
    } else if (percent >= thresholds.heapUsagePercent.warn) {
      anomalies.push({ type: 'memory_warn', severity: 'warn', heapPercent: Number(percent.toFixed(1)), thresholdPercent: thresholds.heapUsagePercent.warn });
    }
  }

  return anomalies;
}

export function configureAlertThresholds(overrides) {
  Object.assign(thresholds, overrides);
  return thresholds;
}