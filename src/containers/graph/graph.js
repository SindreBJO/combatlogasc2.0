import React from 'react';
import { Chart } from 'react-charts';
import './graph.css';

export default function ColoredAreaChart({ dataPoints = [] }) {
  const safeData = dataPoints.filter(
    d => d && !isNaN(d.time) && !isNaN(d.amount)
  );

  const data = React.useMemo(() => {
    if (!safeData.length) {
      return [
        {
          label: 'Amounts',
          data: [{ primary: 0, secondary: 0 }],
        },
        
      ];
    }

    return [
      {
        label: 'Amounts',
        data: safeData.map(d => ({
          primary: Number(d.time),
          secondary: Number(d.amount),
        })),
      },
    ];
  }, [safeData]);

  const primaryAxis = React.useMemo(
    () => ({
      getValue: d => d.primary,
      scaleType: 'linear',
      label: 'Time (sec)',
      formatters: {
        scale: v => `${v} sec`,
        tooltip: v => `${v} sec`,
      },
    }),
    []
  );

  const secondaryAxes = React.useMemo(
    () => [
      {
        getValue: d => d.secondary,
        elementType: 'area',
        label: 'Amount',
        showDatumElements: false,
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
    getSeriesStyle: series => ({
      stroke: series.originalSeries.color || '#ff0000', // line color
      fill: series.originalSeries.color || '#ff0000',   // area color
      fillOpacity: 0.3,
    }),
    tooltip: { show: true },
  }),
  [data, primaryAxis, secondaryAxes]
);

  return (
    <div className='graph-container'
    >
      <Chart options={options} />
    </div>
  );
}
