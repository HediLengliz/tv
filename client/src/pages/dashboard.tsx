import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tv, PlayCircle, Radio, Users } from "lucide-react";
import { getTimeAgo } from "@/lib/utils";
import { BroadcastingActivityChart } from "@/components/charts/broadcasting-activity-chart";

interface Stats {
  totalTvs: number;
  activeContent: number;
  broadcasting: number;
  users: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
}

export default function Dashboard() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentActivity = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activity"],
  });

  const statsCards = [
    {
      title: "Total TVs",
      value: stats?.totalTvs || 0,
      icon: Tv,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Content",
      value: stats?.activeContent || 0,
      icon: PlayCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Broadcasting",
      value: stats?.broadcasting || 0,
      icon: Radio,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Users",
      value: stats?.users || 0,
      icon: Users,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-400';
      case 'info':
        return 'bg-blue-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                        <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-semibold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            );
          })}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Broadcasting Activity Chart */}
          <div className="lg:col-span-2">
            <BroadcastingActivityChart />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className={`h-2 w-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
