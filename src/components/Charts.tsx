export type ChartLine = {
  id: string;
  label: string;
  color: string;
  values: (number | null)[];
  dashed?: boolean;
};

export type Threshold = {
  value: number;
  label: string;
};

type LineChartProps = {
  labels: string[];
  lines: ChartLine[];
  min: number;
  max: number;
  thresholds?: Threshold[];
  height?: number;
};

export function LineChart({ labels, lines, min, max, thresholds = [], height = 250 }: LineChartProps) {
  const width = 720;
  const pad = { l: 40, r: 16, t: 18, b: 32 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const span = max - min || 1;
  const xAt = (index: number) =>
    pad.l + (labels.length <= 1 ? innerW / 2 : (index / (labels.length - 1)) * innerW);
  const yAt = (value: number) => pad.t + ((max - value) / span) * innerH;

  const toPath = (values: (number | null)[]) => {
    let path = "";
    values.forEach((value, index) => {
      if (value == null) return;
      const command = path.length === 0 || values[index - 1] == null ? "M" : "L";
      path += `${command}${xAt(index).toFixed(1)},${yAt(value).toFixed(1)} `;
    });
    return path.trim();
  };

  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, index) => min + (span * index) / ticks);

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Time series chart">
      {grid.map((tick) => (
        <g key={tick}>
          <line className="chart-grid" x1={pad.l} x2={width - pad.r} y1={yAt(tick)} y2={yAt(tick)} />
          <text className="chart-tick" x={pad.l - 8} y={yAt(tick) + 4} textAnchor="end">
            {Math.round(tick)}
          </text>
        </g>
      ))}
      {thresholds.map((threshold) => (
        <g key={threshold.label}>
          <line
            className="chart-threshold"
            x1={pad.l}
            x2={width - pad.r}
            y1={yAt(threshold.value)}
            y2={yAt(threshold.value)}
          />
          <text className="chart-threshold-label" x={width - pad.r} y={yAt(threshold.value) - 4} textAnchor="end">
            {threshold.label}
          </text>
        </g>
      ))}
      {lines.map((line) => (
        <path
          key={line.id}
          d={toPath(line.values)}
          fill="none"
          stroke={line.color}
          strokeWidth={line.dashed ? 2 : 2.4}
          strokeDasharray={line.dashed ? "5 4" : undefined}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {labels.map((label, index) =>
        index % 2 === 0 ? (
          <text key={label} className="chart-tick" x={xAt(index)} y={height - 8} textAnchor="middle">
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function Sparkline({ values, color = "#0F6E67" }: { values: number[]; color?: string }) {
  const width = 120;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function ClassMark({ value }: { value: string }) {
  return <span className={`class-mark class-${value}`}>{value}</span>;
}
