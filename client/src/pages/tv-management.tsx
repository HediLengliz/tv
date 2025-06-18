import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TvModal } from "@/components/tv/tv-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, Filter, Radio, Eye, Edit, Trash2 } from "lucide-react";

export default function TvManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTv, setSelectedTv] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tvs = [], isLoading } = useQuery({
    queryKey: ["/api/tvs", searchQuery, statusFilter],
    queryFn: async () => {
      let url = "/api/tvs";
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { credentials: "include" });
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tvs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tvs"] });
      toast({
        title: "Success",
        description: "TV deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete TV",
        variant: "destructive",
      });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: ({ contentId, tvIds }: { contentId: number; tvIds: number[] }) =>
      apiRequest("POST", "/api/broadcast", { contentId, tvIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tvs"] });
      toast({
        title: "Success",
        description: "Broadcasting started successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start broadcasting",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (tv: any) => {
    setSelectedTv(tv);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this TV?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBroadcast = (tvId: number) => {
    // This would typically open a content selection modal
    // For demo purposes, we'll just show a toast
    toast({
      title: "Broadcasting",
      description: "Content selection modal would open here",
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTv(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">TV Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your TV devices and their configurations
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New TV
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search TVs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="broadcasting">Broadcasting</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Created By</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">John Admin</SelectItem>
                  <SelectItem value="manager">Sarah Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TV Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TV Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tvs.map((tv: any) => (
                <TableRow key={tv.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{tv.name}</div>
                      <div className="text-sm text-muted-foreground">{tv.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">ID: TV-{tv.id.toString().padStart(3, '0')}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tv.status)}>
                      <div className="w-1.5 h-1.5 bg-current rounded-full mr-1.5"></div>
                      {tv.status.charAt(0).toUpperCase() + tv.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {tv.macAddress}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(tv.createdAt)}</div>
                    <div className="text-sm text-muted-foreground">by {tv.createdBy}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBroadcast(tv.id)}
                        disabled={tv.status === 'offline'}
                        className="text-primary hover:text-primary"
                      >
                        <Radio className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(tv)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tv.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <TvModal
        open={isModalOpen}
        onOpenChange={closeModal}
        tv={selectedTv}
      />
    </div>
  );
}
