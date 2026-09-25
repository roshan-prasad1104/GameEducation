import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { useApp } from '../../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * Validated (light & dark, CVD-checked) series colours: indigo = series 1, orange = series 2.
 * Text never uses series colours — axes/labels use neutral ink.
 */
const THEME = {
  light: { series: ['#4f46e5', '#eb6834'], grid: '#eef0f4', ink: '#475569', surface: '#ffffff' },
  dark: { series: ['#6366f1', '#d95926'], grid: '#1f2937', ink: '#cbd5e1', surface: '#111827' },
};

/**
 * Thin, rounded, baseline-anchored bars with hover tooltips.
 *   series: [{ label, data: number[] }] — 1 series = no legend, 2 = legend shown.
 */
export const BarChart = ({ labels, series, horizontal = false, height = 240, valueSuffix = '', max, ariaLabel }) => {
  const { darkMode } = useApp();
  const theme = darkMode ? THEME.dark : THEME.light;
  const multi = series.length > 1;

  const data = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.label,
      data: s.data,
      backgroundColor: theme.series[i % theme.series.length],
      borderRadius: 4,
      borderSkipped: 'start',
      borderColor: theme.surface,
      borderWidth: multi ? 2 : 0,
      maxBarThickness: 28,
    })),
  };

  const valueAxis = {
    beginAtZero: true,
    max,
    grid: { color: theme.grid, drawTicks: false },
    border: { display: false },
    ticks: { color: theme.ink, precision: 0, padding: 6, callback: (v) => `${v}${valueSuffix}` },
  };
  const categoryAxis = {
    grid: { display: false },
    border: { color: theme.grid },
    ticks: { color: theme.ink, autoSkip: true, maxRotation: 0 },
  };

  const options = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: horizontal ? { x: valueAxis, y: categoryAxis } : { x: categoryAxis, y: valueAxis },
    plugins: {
      legend: {
        display: multi,
        position: 'top',
        align: 'end',
        labels: { color: theme.ink, boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 2 },
      },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}${valueSuffix}` },
      },
    },
  };

  return (
    <figure>
      <div style={{ height }} role="img" aria-label={ariaLabel}>
        <Bar data={data} options={options} />
      </div>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead><tr><th>Label</th>{series.map((s) => <th key={s.label}>{s.label}</th>)}</tr></thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={l}><td>{l}</td>{series.map((s) => <td key={s.label}>{s.data[i] ?? '—'}{valueSuffix}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
