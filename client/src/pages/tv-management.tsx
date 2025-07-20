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
import {
  Plus,
  Search,
  Filter,
  Radio,
  Eye,
  Edit,
  Trash2,
  Play,
  StopCircle,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useLocation } from "wouter";

interface Tv {
  id: string;
  name: string;
  description: string;
  status: string;
  macAddress: string;
  createdAt: Date;
  createdBy: string;
}

export default function TvManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTv, setSelectedTv] = useState<Tv | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tvs = [], isLoading } = useQuery<Tv[]>({
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

  const [, setLocation] = useLocation();

  const handleBroadcast = (tvName: string) => {
    setLocation(`/broadcast/${tvName}`);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tvs/${id}`),
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

  const createMutation = useMutation({
    mutationFn: (tvData: any) => apiRequest("POST", "/api/tvs", tvData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tvs"] });
      toast({
        title: "Success",
        description: "TV created successfully",
      });
      closeModal();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create TV",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, tvData }: { id: string; tvData: any }) =>
        apiRequest("PUT", `/api/tvs/${id}`, tvData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tvs"] });
      toast({
        title: "Success",
        description: "TV updated successfully",
      });
      closeModal();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update TV",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (tv: Tv) => {
    setSelectedTv(tv);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!id || !id.trim()) {
      toast({
        title: "Error",
        description: "Invalid TV ID",
        variant: "destructive",
      });
      return;
    }
    deleteMutation.mutate(id);
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
          <div></div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New TV
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
                  <Filter className="mr-2 h-4 w-4" /> Filter
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
                {tvs.map((tv) => (
                    <TableRow key={tv.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{tv.name}</div>
                          <div className="text-sm text-muted-foreground">{tv.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">ID: TV-{tv.id.toString().padStart(3, "0")}</div>
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
                              variant="outline"
                              size="sm"
                              onClick={() => handleBroadcast(tv.name)}
                              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                          >
                            <Play className="h-4 w-4 mr-1" /> Broadcast
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
            onSubmit={(tvData: any) => {
              if (selectedTv) {
                updateMutation.mutate({ id: selectedTv.id, tvData });
              } else {
                createMutation.mutate(tvData);
              }
            }}
        />
      </div>
  );
}