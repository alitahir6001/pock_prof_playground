export type TelemetrySnapshot = Record<string, number>;

export class AdaptationTelemetryAggregator {
  private counters = new Map<string, number>();

  increment(metric: string, by = 1): void {
    const current = this.counters.get(metric) ?? 0;
    this.counters.set(metric, current + by);
  }

  snapshot(): TelemetrySnapshot {
    const out: TelemetrySnapshot = {};
    for (const [k, v] of this.counters.entries()) {
      out[k] = v;
    }
    return out;
  }
}
