import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { Activity, Gauge, Flame, Star } from "lucide-react";
import { OrbitState, gradeBreakdown, mastery, retention, reviewsPerDay, streakDays } from "../lib/orbit";
import { CountUp, Reveal } from "./ui";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);
ChartJS.defaults.font.family = "Manrope";
ChartJS.defaults.color = "#8d97ba";
ChartJS.defaults.borderColor = "rgba(36,48,92,0.5)";

const tooltipStyle = {
  backgroundColor: "#0b1124",
  borderColor: "#24305c",
  borderWidth: 1,
  titleColor: "#eaeefc",
  bodyColor: "#8d97ba",
  padding: 10,
  cornerRadius: 10,
  displayColors: false,
};

export default function StatsView({ state }: { state: OrbitState }) {
  const { cards, logs, decks } = state;
  const perDay = reviewsPerDay(logs, 14);
  const gb = gradeBreakdown(logs);
  const streak = streakDays(logs);
  const mature = cards.filter((c) => mastery(c) >= 1).length;

  const lineData = {
    labels: perDay.map((p) => p.label),
    datasets: [
      {
        label: "Reviews",
        data: perDay.map((p) => p.count),
        borderColor: "#3fd8c2",
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return "rgba(63,216,194,0.15)";
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(63,216,194,0.35)");
          g.addColorStop(1, "rgba(63,216,194,0)");
          return g;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#3fd8c2",
        pointBorderColor: "#060a17",
        pointBorderWidth: 2,
      },
    ],
  };

  const doughnutData = {
    labels: ["Again", "Hard", "Good", "Easy"],
    datasets: [
      {
        data: [gb.again, gb.hard, gb.good, gb.easy],
        backgroundColor: ["#fb7185", "#8f93f8", "#3fd8c2", "#f6c453"],
        borderColor: "#0f1730",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const deckRows = decks.map((d) => {
    const dc = cards.filter((c) => c.deckId === d.id);
    return {
      name: d.name,
      mature: dc.filter((c) => mastery(c) >= 1).length,
      learning: dc.filter((c) => c.reps > 0 && mastery(c) < 1).length,
      fresh: dc.filter((c) => c.reps === 0).length,
    };
  });

  const barData = {
    labels: deckRows.map((r) => r.name),
    datasets: [
      { label: "Mastered", data: deckRows.map((r) => r.mature), backgroundColor: "#f6c453", borderRadius: 4 },
      { label: "Learning", data: deckRows.map((r) => r.learning), backgroundColor: "#3fd8c2", borderRadius: 4 },
      { label: "Uncharted", data: deckRows.map((r) => r.fresh), backgroundColor: "#3a4570", borderRadius: 4 },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 pt-8">
      <Reveal>
        <div>
          <h1 className="font-display text-3xl font-bold text-fog">Flight telemetry</h1>
          <p className="mt-1 text-sm text-mist">How your memory is compounding, one review at a time.</p>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-4">
          <Tile icon={<Activity size={16} />} label="Total reviews" value={<CountUp to={logs.length} />} tone="text-teal" />
          <Tile icon={<Gauge size={16} />} label="Retention" value={<CountUp to={retention(logs)} suffix="%" />} tone="text-gold" />
          <Tile icon={<Flame size={16} />} label="Day streak" value={<CountUp to={streak} />} tone="text-ember" />
          <Tile icon={<Star size={16} />} label="Mastered" value={<CountUp to={mature} />} tone="text-iris" />
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={120} className="lg:col-span-2">
          <div className="panel h-full p-6">
            <h2 className="font-display text-lg font-semibold text-fog">Review velocity</h2>
            <p className="text-xs text-mist">Cards recalled per day — last 14 days</p>
            <div className="mt-5 h-64">
              {logs.length ? (
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: tooltipStyle },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(36,48,92,0.4)" } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              ) : (
                <Empty />
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="panel h-full p-6">
            <h2 className="font-display text-lg font-semibold text-fog">Grade mix</h2>
            <p className="text-xs text-mist">How confidently you're recalling</p>
            <div className="mt-5 flex h-64 items-center justify-center">
              {logs.length ? (
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: {
                      legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 11 } } },
                      tooltip: tooltipStyle,
                    },
                  }}
                />
              ) : (
                <Empty />
              )}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={220}>
        <div className="panel p-6">
          <h2 className="font-display text-lg font-semibold text-fog">Mastery by deck</h2>
          <p className="text-xs text-mist">Where each deck stands on the road to long-term memory</p>
          <div className="mt-5 h-56">
            {cards.length ? (
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y",
                  plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 11 } } }, tooltip: tooltipStyle },
                  scales: {
                    x: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(36,48,92,0.4)" } },
                    y: { stacked: true, grid: { display: false } },
                  },
                }}
              />
            ) : (
              <Empty />
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Tile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="bg-panel px-5 py-5">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-dim">
        <span className={tone}>{icon}</span> {label}
      </p>
      <p className={`mt-1.5 font-display text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line text-sm text-dim">
      Complete a study session to light this up.
    </div>
  );
}
