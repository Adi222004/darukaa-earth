import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function MetricsChart({ metrics = [] }) {
  if (!metrics.length) {
    return <p style={{ color: '#94a3b8' }}>No metrics recorded yet.</p>
  }

  const labels = metrics.map((m) =>
    new Date(m.recorded_at).toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit',
    })
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'Carbon (tons)',
        data: metrics.map((m) => m.carbon_tons),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.15)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: 'Biodiversity Index',
        data: metrics.map((m) => m.biodiversity_index),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        fill: false,
        tension: 0.35,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Carbon (tons)' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Biodiversity Index' },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 1,
      },
    },
  }

  return (
    <div style={{ height: '360px' }}>
      <Line data={data} options={options} />
    </div>
  )
}