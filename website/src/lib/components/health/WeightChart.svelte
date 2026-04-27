<script lang="ts">
  import type { WeightLogEntry } from "$lib/api/types";
  import { cn } from "$lib/utils.js";

  const CHART_WIDTH = 100;
  const CHART_HEIGHT = 48;
  const CHART_PADDING = 6;

  type ChartPoint = {
    timestamp: string;
    weight: number;
    x: number;
    y: number;
  };

  let {
    entries = [],
    class: className,
    emptyLabel = "No weight entries yet.",
  }: {
    entries?: WeightLogEntry[];
    class?: string;
    emptyLabel?: string;
  } = $props();

  const chart = $derived.by(() => buildChart(entries));

  function buildChart(entries: WeightLogEntry[]) {
    const series = [...entries]
      .filter(
        (entry): entry is WeightLogEntry & { weight: number } =>
          entry.weight !== null,
      )
      .sort(
        (left, right) =>
          new Date(left.timestamp).getTime() -
          new Date(right.timestamp).getTime(),
      );

    if (series.length === 0) {
      return {
        points: [] as ChartPoint[],
        polylinePoints: "",
        areaPoints: "",
        minWeight: null,
        maxWeight: null,
        latestWeight: null,
        startLabel: "",
        endLabel: "",
      };
    }

    const weights = series.map((entry) => entry.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const spread = maxWeight - minWeight || 1;
    const drawableWidth = CHART_WIDTH - CHART_PADDING * 2;
    const drawableHeight = CHART_HEIGHT - CHART_PADDING * 2;
    const pointCount = series.length;

    const points = series.map((entry, index) => {
      const x =
        pointCount === 1
          ? CHART_WIDTH / 2
          : CHART_PADDING + (index / (pointCount - 1)) * drawableWidth;
      const normalized = (entry.weight - minWeight) / spread;
      const y =
        CHART_HEIGHT - CHART_PADDING - normalized * drawableHeight;

      return {
        timestamp: entry.timestamp,
        weight: entry.weight,
        x,
        y,
      };
    });

    return {
      points,
      polylinePoints: points.map((point) => `${point.x},${point.y}`).join(" "),
      areaPoints: `${points[0].x},${CHART_HEIGHT - CHART_PADDING} ${points
        .map((point) => `${point.x},${point.y}`)
        .join(" ")} ${points[points.length - 1].x},${CHART_HEIGHT - CHART_PADDING}`,
      minWeight,
      maxWeight,
      latestWeight: points[points.length - 1]?.weight ?? null,
      startLabel: formatDate(points[0].timestamp),
      endLabel: formatDate(points[points.length - 1].timestamp),
    };
  }

  function formatDate(timestamp: string): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp));
  }

  function formatWeight(value: number | null): string {
    return value === null ? "—" : `${value.toFixed(1)} kg`;
  }
</script>

<div class={cn("flex flex-col gap-4", className)}>
  {#if chart.points.length === 0}
    <div
      class="border-border bg-muted/20 text-muted-foreground flex h-56 items-center justify-center rounded-lg border border-dashed text-sm"
    >
      {emptyLabel}
    </div>
  {:else}
    <div class="grid gap-3 sm:grid-cols-3">
      <div>
        <div class="text-muted-foreground text-xs uppercase">Latest</div>
        <div class="text-lg font-semibold">
          {formatWeight(chart.latestWeight)}
        </div>
      </div>
      <div>
        <div class="text-muted-foreground text-xs uppercase">Low</div>
        <div class="text-lg font-semibold">{formatWeight(chart.minWeight)}</div>
      </div>
      <div>
        <div class="text-muted-foreground text-xs uppercase">High</div>
        <div class="text-lg font-semibold">{formatWeight(chart.maxWeight)}</div>
      </div>
    </div>

    <div class="border-border bg-muted/10 rounded-lg border px-4 py-3">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        class="text-primary h-52 w-full overflow-visible"
        aria-label="Weight trend chart"
        role="img"
      >
        <line
          x1={CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING}
          x2={CHART_WIDTH - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          class="stroke-border"
          stroke-width="0.5"
        />
        <line
          x1={CHART_PADDING}
          y1={CHART_HEIGHT / 2}
          x2={CHART_WIDTH - CHART_PADDING}
          y2={CHART_HEIGHT / 2}
          class="stroke-border"
          stroke-width="0.35"
          stroke-dasharray="1.5 1.5"
        />
        <polygon
          points={chart.areaPoints}
          fill="currentColor"
          fill-opacity="0.12"
        />
        <polyline
          points={chart.polylinePoints}
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
        />
        {#each chart.points as point (point.timestamp)}
          <circle
            cx={point.x}
            cy={point.y}
            r="1.65"
            fill="currentColor"
            class="stroke-background"
            stroke-width="0.7"
          />
        {/each}
      </svg>

      <div class="text-muted-foreground mt-2 flex justify-between text-xs">
        <span>{chart.startLabel}</span>
        <span>{chart.endLabel}</span>
      </div>
    </div>
  {/if}
</div>
