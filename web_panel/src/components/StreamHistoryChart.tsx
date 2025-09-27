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
import { useTheme } from "../context/ThemeContext";

type StreamData = {
  date: string;
  streams: number;
};

type Props = {
  data: StreamData[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme();

  if (active && payload?.length) {
    return (
      <div
        className={`p-2 rounded shadow text-sm ${
          theme === "light"
            ? "bg-white text-gray-900"
            : "bg-gray-700 text-gray-100"
        }`}
      >
        <div className="font-semibold">{label}</div>
        <div>Toplam Dinleme: {formatNumber(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export const StreamHistoryChart: React.FC<Props> = ({ data }) => {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400">
        Mevcut Stream Verisi Bulunamadı
      </div>
    );
  }

  return (
    <div
      className={`w-full h-64 p-4 rounded-xl shadow-md transition-colors ${
        theme === "light"
          ? "bg-gradient-to-br from-white to-gray-100"
          : "bg-gradient-to-br from-gray-800 to-gray-700"
      }`}
    >
      <ResponsiveContainer>
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === "light" ? "#e5e7eb" : "#374151"}
          />
          <XAxis
            dataKey="date"
            stroke={theme === "light" ? "#4b5563" : "#d1d5db"}
          />
          <YAxis
            tickFormatter={formatNumber}
            stroke={theme === "light" ? "#4b5563" : "#d1d5db"}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Animated line */}
          <Line
            type="monotone"
            dataKey="streams"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{
              r: 3,
              strokeWidth: 2,
              stroke: "#4f46e5",
              fill: "#4f46e5",
            }}
            isAnimationActive={false}
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
