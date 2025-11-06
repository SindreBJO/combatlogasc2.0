import React from "react";
import { Chart } from "react-charts";
import "./graph.css";

export default function ColoredAreaChart({ dataPoints = [[], []], name = "", color }) {
  const [dataA = [], dataB = []] = Array.isArray(dataPoints) ? dataPoints : [[], []];

  const clean = (arr) =>
    Array.isArray(arr)
      ? arr.filter((d) => d && !isNaN(d.time) && !isNaN(d.amount))
      : [];

  const safeAllData = clean(dataA);
  const safeBossData = clean(dataB);

  // --- Build chart data series ---
  const data = React.useMemo(() => {
    const series = [];

    if (safeBossData.length) {
      series.push({
        label: `${name} (Boss)`,
        data: safeBossData.map((d) => ({
          primary: Number(d.time),
          secondary: Number(d.amount),
        })),
        color: "#ff0000ff",
      });
    }

    if (safeAllData.length) {
      series.push({
        label: `${name} (Adds)`,
        data: safeAllData.map((d) => ({
          primary: Number(d.time),
          secondary: Number(d.amount),
        })),
        color: "#8f0037ff",
      });
    }

    // fallback for empty data
    return series.length
      ? series
      : [{ label: "Empty", data: [{ primary: 0, secondary: 0 }] }];
  }, [safeAllData, safeBossData, name]);

  // --- Calculate dynamic min/max time for the X axis ---
  const allTimes = React.useMemo(() => {
    const t = [...safeAllData, ...safeBossData].map((d) => +d.time);
    return t.length ? [Math.min(...t), Math.max(...t)] : [0, 1];
  }, [safeAllData, safeBossData]);

  const primaryAxis = React.useMemo(
    () => ({
      getValue: (d) => d.primary,
      scaleType: "linear",
      label: "Time (sec)",
      min: Math.floor(allTimes[0]),
      max: Math.ceil(allTimes[1]),
      formatters: {
        scale: (v) => `${v}s`,
        tooltip: (v) => `${(Number(v) || 0).toFixed(1)} sec`,
      },
    }),
    [allTimes]
  );

  const secondaryAxes = React.useMemo(
    () => [
      {
        getValue: (d) => d.secondary,
        elementType: "area",
        label: name,
        stacked: true,
        showDatumElements: false,
        formatters: {
          scale: (v) => `${((v ?? 0) / 1000).toFixed(0)}k`,
          tooltip: (v) => `${((v ?? 0) / 1000).toFixed(1)}k ${name}`,
        },
      },
    ],
    [name]
  );

  const options = React.useMemo(
    () => ({
      data,
      primaryAxis,
      secondaryAxes,
      dark: true,

      padding: {
        left: 10,
        right: 10,
        top: 15,
        bottom: 5,
      },

      interactionMode: "primary",
      tooltip: {
        show: true,
        mode: "multi",
        anchor: "closest",
        align: "auto",
      },

      getSeriesStyle: (series) => {
        const explicitColor = series.originalSeries?.color || color;
        return {
          stroke: explicitColor,
          fill: explicitColor,
          fillOpacity: 0.95,
        };
      },
    }),
    [data, primaryAxis, secondaryAxes, color]
  );

  return (
    <div className="graph-container">
      <Chart options={options} />
    </div>
  );
}
