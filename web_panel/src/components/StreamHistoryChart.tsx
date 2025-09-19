// web_panel/src/components/StreamHistoryChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "../utils/format";
import { motion } from "framer-motion";

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
      <div className="bg-white dark:bg-gray-700 p-2 rounded shadow text-sm text-gray-900 dark:text-gray-100">
        <div className="font-semibold">{label}</div>
        <div>Toplam Dinleme: {formatNumber(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export const StreamHistoryChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400">
        Mevcut Stream Verisi Bulunamadı
      </div>
    );
  }

  return (
    <div className="w-full h-64 p-4 rounded-xl shadow-md bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-700">
      <ResponsiveContainer>
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#4b5563" className="dark:text-gray-200" />
          <YAxis tickFormatter={formatNumber} stroke="#4b5563" className="dark:text-gray-200" />
          <Tooltip content={<CustomTooltip />} />

          {/* Animated line */}
          <Line
            type="monotone"
            dataKey="streams"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 2, stroke: "#4f46e5", fill: "#4f46e5" }}
            isAnimationActive={false} // Disable default Recharts animation
            // @ts-ignore
            shape={(props: any) => {
              const { points, ...rest } = props;
              const pathD = points.reduce(
                (acc: string, point: any, i: number) =>
                  i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`,
                ""
              );

              return (
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  {...rest}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StreamHistoryChart;