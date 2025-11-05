import React from 'react';
import { Chart } from 'react-charts';
import './graph.css';

export default function ColoredAreaChart({ dataPoints = [[0],[0]], name = "", color }) {
const [dataA = [], dataB = []] = Array.isArray(dataPoints) ? dataPoints : [[], []];

const clean = arr =>
  Array.isArray(arr)
    ? arr.filter(d => d && !isNaN(d.time) && !isNaN(d.amount))
    : [];

const safeAllData = clean(dataA);
const safeBossData = clean(dataB);

  const data = React.useMemo(() => {
  if (!safeAllData.length && !safeBossData.length) {
    return [
      {
        label: 'Amounts',
        data: [{ primary: 0, secondary: 0 }],
      },
    ];
  }

  const series = [];

    if (safeBossData.length) {
    series.push({
      label: `${name} (Boss)`,
      data: safeBossData.map(d => ({
        primary: Number(d.time),
        secondary: Number(d.amount),
      })),
      color: '#ff0000ff', // ← give it a distinct color
    });
  }

  if (safeAllData.length) {
    series.push({
      label: `${name} (Adds)`,
      data: safeAllData.map(d => ({
        primary: Number(d.time),
        secondary: Number(d.amount),
      })),
      color: '#8f0037ff', // optional custom color
    });
  }



  return series;
}, [safeAllData, safeBossData, name, color]);

  const primaryAxis = React.useMemo(
    () => ({
      getValue: d => d.primary,
      scaleType: 'linear',
      label: 'Time (sec)',
      formatters: {
        scale: v => `${v} s`,
        tooltip: v => `${(Number(v) || 0).toFixed(1)} sec`,
      },
    }),
    []
  );

const secondaryAxes = React.useMemo(
  () => [
    {
      getValue: d => d.secondary,
      elementType: 'area',
      label: name,
      stacked: true,
      showDatumElements: false,
      formatters: {
        scale: v => `${((v ?? 0) / 1000).toFixed(0)}k`,
        tooltip: v => `${((v ?? 0) / 1000).toFixed(1)}k ${name}`,
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
    domain: [0, 100],
    padding: {
          left: 10,
          right: 10,
          top: 15,
          bottom: 5,
        },

    interactionMode: 'primary',

    tooltip: {
      show: true,
      mode: 'multi',
      anchor: 'closest',
      align: 'auto',
    },
    
    getSeriesStyle: series => {
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
    <div className='graph-container'
    >
      <Chart options={options} />
    </div>
  );
}
