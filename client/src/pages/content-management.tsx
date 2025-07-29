import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentModal } from "@/components/content/content-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, Filter, Play, Eye, Edit, Trash2, Image } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Content } from "@shared/schema";

interface ContentItem extends Omit<Content, 'selectedTvs'> {
  createdBy?: string;
  selectedTvs?: string[];
}

export default function ContentManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: content = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content", searchQuery, statusFilter],
    queryFn: async () => {
      let url = "/api/content";
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, { credentials: "include" });
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete content",
        variant: "destructive",
      });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: ({ contentId, name }: { contentId: string; name: string[] }) =>
        apiRequest("POST", "/api/broadcast", { contentId, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
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

  const handleEdit = (content: ContentItem) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleBroadcast = (content: ContentItem) => {
    if (!content.selectedTvs || content.selectedTvs.length === 0) {
      toast({
        title: "Warning",
        description: "No TVs selected for this content",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate({
      contentId: content.id!,
      name: content.selectedTvs
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContent(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Content
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
                      placeholder="Search content..."
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
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

        {/* Content Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TVs</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            {item.videoUrl ? (
                                <video
                                    src={item.videoUrl}
                                    className="h-full w-full object-cover"
                                    style={{ objectFit: 'cover', width: '100%', height: '100%', background: 'black' }}
                                    controls={false}
                                    muted
                                    preload="metadata"
                                    onError={e => { (e.target as HTMLVideoElement).poster = 'https://placehold.co/96x96?text=No+Video'; }}
                                />
                            ) : item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                />
                            )  : item.docUrl ? (
                                (() => {
                                  const url = item.docUrl.startsWith('http') ? item.docUrl : `${window.location.origin}${item.docUrl}`;
                                  const ext = item.docUrl.split('.').pop()?.toLowerCase();
                                  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
                                  if (ext === 'pdf') {
                                    return (
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-full h-full">
                                          <span role="img" aria-label="PDF" className="text-3xl mb-1">📄</span>
                                          <span className="text-xs truncate max-w-[80px]">{item.docUrl.split('/').pop()}</span>
                                          <span className="text-[10px] mt-1">PDF Preview</span>
                                        </a>
                                    );
                                  } else if (ext === 'doc' || ext === 'docx') {
                                    if (isLocal) {
                                      // Local: direct download
                                      return (
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-full h-full">
                                            <span role="img" aria-label="Word" className="text-3xl mb-1">📝</span>
                                            <span className="text-xs truncate max-w-[80px]">{item.docUrl.split('/').pop()}</span>
                                            <span className="text-[10px] mt-1">Download DOCX</span>
                                          </a>
                                      );
                                    } else {
                                      // Production: Google Docs Viewer
                                      const googleViewer = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
                                      return (
                                          <iframe
                                              src={googleViewer}
                                              title="Word Document"
                                              className="w-full h-full"
                                              style={{ minHeight: '120px', border: 'none', background: 'white' }}
                                          />
                                      );
                                    }
                                  } else {
                                    return (
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-full h-full">
                                          <span role="img" aria-label="Document" className="text-3xl mb-1">📁</span>
                                          <span className="text-xs truncate max-w-[80px]">{item.docUrl.split('/').pop()}</span>
                                          <span className="text-[10px] mt-1">Download</span>
                                        </a>
                                    );
                                  }
                                })()
                            ) : (
                                <Image className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {item.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.selectedTvs && item.selectedTvs.length > 0 ? (
                            <Badge variant="outline">{item.selectedTvs.length} TVs</Badge>
                        ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(item.createdAt)}</div>
                        <div className="text-sm text-muted-foreground">by {item.createdBy}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id!)}
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

        <ContentModal
            open={isModalOpen}
            onOpenChange={closeModal}
            content={selectedContent}
        />
      </div>
  );
}
