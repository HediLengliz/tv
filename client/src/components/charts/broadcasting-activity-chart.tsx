import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Chart as ChartJS } from 'chart.js';

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

interface ActivityData {
  id: string;
  type: string;
  message: string;
  time: string;
  createdAt: string;
}

interface StatusCounts {
  online?: number;
  offline?: number;
  broadcasting?: number;
  maintenance?: number;
  draft?: number;
  active?: number;
  scheduled?: number;
  archived?: number;
  pending?: number;
  inactive?: number;
}

interface AnalyticsData {
  date: string;
  tvs: number;
  content: number;
  users: number;
  tvStatuses: StatusCounts;
  contentStatuses: StatusCounts;
  userStatuses: StatusCounts;
}

export function BroadcastingActivityChart() {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'doughnut'>('line');
  const [timeRange, setTimeRange] = useState('7d');
  const [dataSource, setDataSource] = useState<'analytics' | 'activity'>('analytics');

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery<AnalyticsData[]>({
    queryKey: ['/api/analytics/broadcasting-activity', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/broadcasting-activity?timeRange=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch analytics data');
      return res.json();
    },
    refetchInterval: 15000,
    enabled: dataSource === 'analytics',
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

  if (isAnalyticsLoading || isActivityLoading) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>{dataSource === 'analytics' ? 'TVs, Content, and Users Analytics' : 'Recent Activity'}</CardTitle>
            <CardDescription>
              {dataSource === 'analytics' ? 'Track TVs, content, and users with statuses over time' : 'Track recent activities by type'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
    );
  }

  // Process Analytics Data
  const analyticsLabels = analyticsData?.map((item) => item.date) || [];
  const tvData = analyticsData?.map((item) => item.tvs) || [];
  const contentData = analyticsData?.map((item) => item.content) || [];
  const userData = analyticsData?.map((item) => item.users) || [];

  const tvStatusData = {
    online: analyticsData?.map((item) => item.tvStatuses.online || 0) || [],
    offline: analyticsData?.map((item) => item.tvStatuses.offline || 0) || [],
    broadcasting: analyticsData?.map((item) => item.tvStatuses.broadcasting || 0) || [],
    maintenance: analyticsData?.map((item) => item.tvStatuses.maintenance || 0) || [],
  };
  const contentStatusData = {
    draft: analyticsData?.map((item) => item.contentStatuses.draft || 0) || [],
    active: analyticsData?.map((item) => item.contentStatuses.active || 0) || [],
    scheduled: analyticsData?.map((item) => item.contentStatuses.scheduled || 0) || [],
    archived: analyticsData?.map((item) => item.contentStatuses.archived || 0) || [],
  };
  const userStatusData = {
    pending: analyticsData?.map((item) => item.userStatuses.pending || 0) || [],
    active: analyticsData?.map((item) => item.userStatuses.active || 0) || [],
    inactive: analyticsData?.map((item) => item.userStatuses.inactive || 0) || [],
  };

  // Process Activity Data
  const activityLabels = Array.from(new Set(activityData?.map((item) => new Date(item.createdAt).toISOString().split('T')[0]))).sort();
  const activityByDateAndType = activityLabels.map((date) => {
    const activitiesOnDate = activityData?.filter((item) => new Date(item.createdAt).toISOString().split('T')[0] === date) || [];
    return {
      date,
      success: activitiesOnDate.filter((item) => item.type === 'success').length,
      info: activitiesOnDate.filter((item) => item.type === 'info').length,
      warning: activitiesOnDate.filter((item) => item.type === 'warning').length,
      error: activitiesOnDate.filter((item) => item.type === 'error').length,
    };
  });

  // Pie/Doughnut Totals
  const totalTvs = tvData.reduce((a, b) => a + b, 0);
  const totalContent = contentData.reduce((a, b) => a + b, 0);
  const totalUsers = userData.reduce((a, b) => a + b, 0);
  const totalSuccess = activityByDateAndType.reduce((a, b) => a + b.success, 0);
  const totalInfo = activityByDateAndType.reduce((a, b) => a + b.info, 0);
  const totalWarning = activityByDateAndType.reduce((a, b) => a + b.warning, 0);
  const totalErrors = activityByDateAndType.reduce((a, b) => a + b.error, 0);

  const analyticsPieData = {
    labels: ['TVs', 'Content', 'Users'],
    datasets: [{
      data: [totalTvs, totalContent, totalUsers],
      backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(153, 102, 255, 0.7)'],
      borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(153, 102, 255)'],
      borderWidth: 2,
    }],
  };

  const activityPieData = {
    labels: ['Success', 'Info', 'Warning', 'Errors'],
    datasets: [{
      data: [totalSuccess, totalInfo, totalWarning, totalErrors],
      backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(234, 179, 8, 0.7)', 'rgba(239, 68, 68, 0.7)'],
      borderColor: ['rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(234, 179, 8)', 'rgb(239, 68, 68)'],
      borderWidth: 2,
    }],
  };

  const analyticsChartData = {
    labels: analyticsLabels,
    datasets: [
      {
        label: 'Total TVs',
        data: tvData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Online TVs',
        data: tvStatusData.online,
        borderColor: 'rgba(75, 192, 192, 0.5)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.3,
        fill: true,
        hidden: true,
      },
      {
        label: 'Broadcasting TVs',
        data: tvStatusData.broadcasting,
        borderColor: 'rgba(75, 192, 192, 0.7)',
        backgroundColor: 'rgba(75, 192, 192, 0.15)',
        tension: 0.3,
        fill: true,
        hidden: true,
      },
      {
        label: 'Total Content',
        data: contentData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Active Content',
        data: contentStatusData.active,
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.3,
        fill: true,
        hidden: true,
      },
      {
        label: 'Total Users',
        data: userData,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Active Users',
        data: userStatusData.active,
        borderColor: 'rgba(153, 102, 255, 0.5)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        tension: 0.3,
        fill: true,
        hidden: true,
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
        labels: { font: { size: 14 } },
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y ?? context.parsed}`,
        },
      },
      title: { display: false },
    },
    scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
      x: { grid: { color: '#e5e7eb' }, ticks: { font: { size: 12 } } },
      y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { stepSize: 1, font: { size: 12 } } },
    },
    indexAxis: (chartType === 'bar' ? 'y' : 'x') as 'x' | 'y' | undefined,
  };

  const ChartComponent = chartType === 'line' ? Line : chartType === 'bar' ? Bar : chartType === 'pie' ? Pie : Doughnut;
  const dataToShow = dataSource === 'analytics'
      ? (chartType === 'pie' || chartType === 'doughnut' ? analyticsPieData : analyticsChartData)
      : (chartType === 'pie' || chartType === 'doughnut' ? activityPieData : activityChartData);

  return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{dataSource === 'analytics' ? 'TVs, Content, and Users Analytics' : 'Recent Activity'}</CardTitle>
              <CardDescription>
                {dataSource === 'analytics' ? 'Track TVs, content, and users with statuses over time' : 'Track recent activities by type'}
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
                  <SelectItem value="analytics">Analytics Data</SelectItem>
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