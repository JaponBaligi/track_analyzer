// web_panel/src/components/StreamHistoryChart.tsx
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { formatNumber } from "../utils/format";

type StreamData = {
  date: string;
  streams: number;
};

type Props = {
  data: StreamData[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-sm">
        <div className="font-semibold">{label}</div>
        <div>Toplam Dinleme: {formatNumber(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export const StreamHistoryChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-gray-500">Mevcut Stream Verisi Bulunamadı</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="streams" stroke="#4f46e5" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
