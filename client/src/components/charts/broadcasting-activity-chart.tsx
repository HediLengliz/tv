import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement, Filler,
} from 'chart.js';
import { Line, Pie, Doughnut } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Chart as ChartJS, registerables } from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface BroadcastingActivityData {
  date: string;
  broadcasts: number;
  content: number;
  errors: number;
}

interface ActivityData {
  id: string;
  type: string;
  message: string;
  time: string;
  createdAt: string;
}

export function BroadcastingActivityChart() {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'doughnut'>('line');
  const [timeRange, setTimeRange] = useState('7d');
  const [dataSource, setDataSource] = useState<'broadcasting' | 'activity'>('broadcasting');

  const { data: broadcastingData, isLoading: isBroadcastingLoading } = useQuery<BroadcastingActivityData[]>({
    queryKey: ['/api/analytics/broadcasting-activity', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/broadcasting-activity?timeRange=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch broadcasting activity data');
      return res.json();
    },
    refetchInterval: 15000,
    enabled: dataSource === 'broadcasting',
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery<ActivityData[]>({
    queryKey: ['/api/activity', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/activity?timeRange=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch activity data');
      return res.json();
    },
    refetchInterval: 15000,
    enabled: dataSource === 'activity',
  });

  if (isBroadcastingLoading || isActivityLoading) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>{dataSource === 'broadcasting' ? 'Broadcasting Activity' : 'Recent Activity'}</CardTitle>
            <CardDescription>
              {dataSource === 'broadcasting' ? 'Track broadcast performance over time' : 'Track recent activities by type'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
    );
  }

  // Process BroadcastingActivity data
  const broadcastingLabels = broadcastingData?.map((item) => item.date) || [];
  const broadcastData = broadcastingData?.map((item) => item.broadcasts) || [];
  const contentData = broadcastingData?.map((item) => item.content) || [];
  const errorData = broadcastingData?.map((item) => item.errors) || [];

  // Process Activity data (group by date and type)
  const activityLabels = Array.from(new Set(activityData?.map((item) => new Date(item.createdAt).toISOString().split('T')[0]))).sort();  const activityByDateAndType = activityLabels.map((date) => {
    const activitiesOnDate = activityData?.filter((item) => new Date(item.createdAt).toISOString().split('T')[0] === date) || [];
    return {
      date,
      success: activitiesOnDate.filter((item) => item.type === 'success').length,
      info: activitiesOnDate.filter((item) => item.type === 'info').length,
      warning: activitiesOnDate.filter((item) => item.type === 'warning').length,
      error: activitiesOnDate.filter((item) => item.type === 'error').length,
    };
  });

  // For Pie/Doughnut: sum totals
  const totalBroadcasts = broadcastData.reduce((a, b) => a + b, 0);
  const totalContent = contentData.reduce((a, b) => a + b, 0);
  const totalErrors = errorData.reduce((a, b) => a + b, 0);

  const totalSuccess = activityByDateAndType.reduce((a, b) => a + b.success, 0);
  const totalInfo = activityByDateAndType.reduce((a, b) => a + b.info, 0);
  const totalWarning = activityByDateAndType.reduce((a, b) => a + b.warning, 0);
  const totalActivityErrors = activityByDateAndType.reduce((a, b) => a + b.error, 0);

  const broadcastingPieData = {
    labels: ['Broadcasts', 'Content', 'Errors'],
    datasets: [
      {
        data: [totalBroadcasts, totalContent, totalErrors],
        backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(255, 205, 86, 0.7)'],
        borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(255, 205, 86)'],
        borderWidth: 2,
      },
    ],
  };

  const activityPieData = {
    labels: ['Success', 'Info', 'Warning', 'Errors'],
    datasets: [
      {
        data: [totalSuccess, totalInfo, totalWarning, totalActivityErrors],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)', // Green for success
          'rgba(59, 130, 246, 0.7)', // Blue for info
          'rgba(234, 179, 8, 0.7)', // Yellow for warning
          'rgba(239, 68, 68, 0.7)', // Red for error
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const broadcastingChartData = {
    labels: broadcastingLabels,
    datasets: [
      {
        label: 'Active Broadcasts',
        data: broadcastData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Content Items',
        data: contentData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Errors',
        data: errorData,
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const activityChartData = {
    labels: activityLabels,
    datasets: [
      {
        label: 'Success',
        data: activityByDateAndType.map((item) => item.success),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Info',
        data: activityByDateAndType.map((item) => item.info),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Warning',
        data: activityByDateAndType.map((item) => item.warning),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Errors',
        data: activityByDateAndType.map((item) => item.error),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 14 },
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y ?? context.parsed}`;
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
      x: {
        grid: { color: '#e5e7eb' },
        ticks: { font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { stepSize: 1, font: { size: 12 } },
      },
    },
  };

  let ChartComponent;
  let dataToShow;
  if (chartType === 'line') {
    ChartComponent = Line;
    dataToShow = dataSource === 'broadcasting' ? broadcastingChartData : activityChartData;
  } else if (chartType === 'bar') {
    ChartComponent = Bar;
    dataToShow = dataSource === 'broadcasting' ? broadcastingChartData : activityChartData;
  } else if (chartType === 'pie') {
    ChartComponent = Pie;
    dataToShow = dataSource === 'broadcasting' ? broadcastingPieData : activityPieData;
  } else {
    ChartComponent = Doughnut;
    dataToShow = dataSource === 'broadcasting' ? broadcastingPieData : activityPieData;
  }

  return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{dataSource === 'broadcasting' ? 'Broadcasting Activity' : 'Recent Activity'}</CardTitle>
              <CardDescription>
                {dataSource === 'broadcasting' ? 'Track broadcast performance over time' : 'Track recent activities by type'}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                  <SelectItem value="90d">90d</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                  <SelectItem value="doughnut">Doughnut</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dataSource} onValueChange={(value: any) => setDataSource(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcasting">Broadcasting Data</SelectItem>
                  <SelectItem value="activity">Recent Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartComponent data={dataToShow} options={options} />
          </div>
        </CardContent>
      </Card>
  );
}