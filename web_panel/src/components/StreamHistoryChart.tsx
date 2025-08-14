// web_panel/src/components/StreamHistoryChart.tsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatNumber } from "../utils/format";

type Props = {
  data: { date: string; streams: number }[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-sm">
        <div className="font-semibold">{label}</div>
        <div>Total Streams: {formatNumber(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export const StreamHistoryChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length < 2) return null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="streams" stroke="#8884d8" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
