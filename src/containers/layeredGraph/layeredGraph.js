import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./layeredGraph.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend);

export default function StackedAreaChart({ entryObject = [] }) {

/*  
  Expected Entry:

  entryObject = [
    {
      metaData: {
        metricName:  *,       // string
        spellSchool: *,       // number or string
        color:       *,       // hex or rgb string
        spellName:   *        // string
      },
      data: [
        // time-series: [timestamp, amount]
        [timestamp, amount],
        [timestamp, amount],
        [timestamp, amount],
        // ...n
      ]
    },

    // ...n objects of same structure
  ];
*/

  const [isVisible, setIsVisible] = useState(false);

  // Fade animation on dataset update
  useEffect(() => {
    setIsVisible(false);
    const t = setTimeout(() => setIsVisible(true), 40);
    return () => clearTimeout(t);
  }, [entryObject]);

  const chartRef = useRef(null);

  // ---------------------------------------
  // Convert your data → chart.js format
  // ---------------------------------------
  const sortedTimePoints = useMemo(() => {
    const all = entryObject.flatMap((obj) => obj.data.map((d) => d.time));
    return [...new Set(all)].sort((a, b) => a - b);
  }, [entryObject]);

  const datasets = useMemo(() => {
    const chart = chartRef.current;

    return entryObject.map((obj) => {
      const color = obj.metaData.color || "#8888ff";

      // Gradient fill
      let gradient = null;
      if (chart) {
        const ctx = chart.ctx;
        gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, `${color}88`);
        gradient.addColorStop(1, `${color}00`);
      }

      return {
        label: obj.metaData.spellName,
        data: sortedTimePoints.map(
          (t) => obj.data.find((d) => d.time === t)?.amount || 0
        ),
        fill: true,
        borderColor: color,
        backgroundColor: gradient || color + "33",
        pointRadius: 0,
        tension: 0.25,
        stack: "total",
      };
    });
  }, [entryObject, sortedTimePoints]);

  const data = {
    labels: sortedTimePoints,
    datasets,
  };

  // ---------------------------------------
  // Chart options
  // ---------------------------------------
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 600,
      easing: "easeOutQuart",
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: "#ccc",
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: "#ccc",
          callback: (v) => `${(v / 1000).toFixed(0)}k`,
        },
        grid: {
          color: "rgba(255,255,255,0.1)",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: "#fff" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#222",
        titleColor: "#fff",
        bodyColor: "#ddd",
        callbacks: {
          label: (ctx) => {
            const value = ctx.raw ?? 0;
            return `${ctx.dataset.label}: ${(value / 1000).toFixed(1)}k`;
          },
        },
      },
    },
  };

  return (
    <div className={`graph-container ${isVisible ? "visible" : ""}`}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
