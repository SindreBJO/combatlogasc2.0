import React, { useMemo } from "react";

export default function SimpleGraph({ data, height = 60, width }) {
  // Convert data objects → numeric values
  const values = useMemo(() => data.map(d => d.totalDamage || 0), [data]);

  const svgWidth = width || window.innerWidth * 0.9;
  const maxValue = Math.max(...values);
  const minValue = 0;
  const range = maxValue - minValue || 1; // prevent divide-by-zero
  const step = svgWidth / (values.length - 1 || 1);
  const padding = 10;
  const usableHeight = height - padding * 2;

  const points = values
    .map((value, i) => {
      const x = i * step;
      const y = height - padding - ((value - minValue) / range) * usableHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `0,${height} ${points} ${svgWidth},${height}`;

  return (
    <svg
      width={svgWidth}
      height={height}
      style={{
        background: "#111",
        borderRadius: "0px",
        overflow: "visible",
      }}
    >
      {/* Fill under the line */}
      <polygon
        fill="#00ffcc"
        opacity="0.2"
        points={fillPoints}
      />

      {/* Line */}
      <polyline
        fill="none"
        stroke="#00ffcc"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}
