import React, {useState, useEffect} from 'react';
import { Chart } from 'react-charts';
import './graph.css';

export default function ColoredAreaChartDamageTaken({ dataPoints = [[], [], []], color }) {

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade out immediately
    setIsVisible(false);

    // Then fade back in shortly after (forces CSS transition)
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [dataPoints], []); // 👈 triggers on updates

  const [dataA = [], dataB = [], dataC = []] = Array.isArray(dataPoints)
    ? dataPoints
    : [[], [], []];

  const clean = arr =>
    Array.isArray(arr)
      ? arr.filter(d => d && !isNaN(d.time) && !isNaN(d.amount))
      : [];

  const safeAllDamageTaken = clean(dataA);
  const safeAllHealingTaken = clean(dataB);
  const safeAbsorbTaken = clean(dataC);

  const data = React.useMemo(() => {
    const series = [];

    if (safeAllHealingTaken.length) {
      series.push({
        label: 'Healing Done',
        data: safeAllHealingTaken.map(d => ({ primary: +d.time, secondary: +d.amount })),
        color: '#00ff00ff',
      });
    }
    if (safeAbsorbTaken.length) {
      series.push({
        label: 'Damage Absorbed',
        data: safeAbsorbTaken.map(d => ({ primary: +d.time, secondary: +d.amount })),
        color: '#ffffffff',
      });
    }

    if (safeAllDamageTaken.length) {
      series.push({
        label: 'Total Unhealed Damage',
        data: safeAllDamageTaken.map(d => ({ primary: +d.time, secondary: +d.amount })),
        color: '#0051ff', 
      });
    }




    return series.length
      ? series
      : [{ label: 'Empty', data: [{ primary: 0, secondary: 0 }] }];
  }, [safeAllDamageTaken, safeAllHealingTaken, safeAbsorbTaken]);

const primaryAxis = React.useMemo(
  () => ({
    getValue: d => d.primary,
    scaleType: 'linear',
    label: 'Time (sec)',
    min: 0,
    max: Math.max(
      ...safeAllDamageTaken.map(d => +d.time),
      ...safeAllHealingTaken.map(d => +d.time),
      ...safeAbsorbTaken.map(d => +d.time)
    ),
    formatters: {
      scale: v => `${v}s`,
      tooltip: v => `${Number(v).toFixed(1)} sec`,
    },
  }),
  [safeAllDamageTaken, safeAllHealingTaken, safeAbsorbTaken]
);

  const secondaryAxes = React.useMemo(
    () => [
      {
        getValue: d => d.secondary,
        elementType: "area",
        label: "Amount",
        stacked: true,
        showDatumElements: false,
        formatters: {
          scale: (v) => `${((v ?? 0) / 1000).toFixed(1)}k`,
          tooltip: (v) => `${((v ?? 0) / 1000).toFixed(1)}k`,
        },
      },
    ],
    []
  );

  const options = React.useMemo(
    () => ({
      data,
      primaryAxis,
      secondaryAxes,
      dark: true,
      domain: [0, 100],
  
      getSeriesStyle: series => {
        const explicitColor = series.originalSeries?.color || color;
        return {
          stroke: explicitColor,
          fill: explicitColor,
          fillOpacity: 0.95,
          strokeWidth: 2,
          strokeOpacity: 0.9,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          circleRadius: 3,
          circleStroke: '#000000ff',
          circleStrokeWidth: 1,
          circleFill: explicitColor,
          circleOpacity: 1,
          transition: 'none',
          hover: {
            strokeWidth: 3,
            fillOpacity: 0.7,
            circleRadius: 4,
          },
        };
      },
      padding: {
          left: 15,
          right: 10,
          top: 15,
          bottom: 5,
        },
  
      tooltip: {
        show: true,
        mode: 'multi',
        anchor: 'closest',   // 👈 positions tooltip closest to hovered point
        align: 'auto',       // 👈 makes it follow your cursor intelligently
      },
  
      interactionMode: 'primary', // ✅ aligns hover by X axis
    }),
    [data, primaryAxis, secondaryAxes, color]
  );

  return (
    <div className={`graph-container ${isVisible ? "visible" : ""}`}>
      <Chart options={options} />
    </div>
  );
}
