import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatNumber } from "../../utils/format";
import { StreamPoint, StreamState } from "../../types/database";

interface StreamChartSectionProps {
  series: StreamPoint[];
  streamState: StreamState | undefined;
}

export const StreamChartSection: React.FC<StreamChartSectionProps> = ({ series, streamState }) => {
  const isDark = document.documentElement.classList.contains("dark");

  if (streamState?.loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        Yükleniyor…
      </div>
    );
  }

  if (streamState?.error) {
    return (
      <div className="h-full flex items-center justify-center text-red-600 dark:text-red-400 text-sm">
        {streamState.error}
      </div>
    );
  }

  if (series.length <= 1) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        Grafik için yeterli veri yok.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis tickFormatter={formatNumber} stroke="#9CA3AF" />
          <Tooltip
            formatter={(value: any) => formatNumber(value as number)}
            labelFormatter={(label) => `Tarih: ${label}`}
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              border: "1px solid",
              borderColor: isDark ? "#374151" : "#d1d5db",
              color: isDark ? "#f9fafb" : "#111827",
            }}
            labelStyle={{
              color: isDark ? "#f9fafb" : "#111827",
            }}
          />
          <Line type="monotone" dataKey="streams" dot stroke="#3B82F6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

