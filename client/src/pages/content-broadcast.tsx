import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, ArrowLeft, Info } from "lucide-react";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Helper to get absolute media/document URL
const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${window.location.origin}${url}`;
};

// Helper to render document files
const renderDocument = (docUrl: string) => {
    if (!docUrl) return <div>No document URL provided</div>;
    const fileUrl = getMediaUrl(docUrl);
    const ext = docUrl.toLowerCase().split('.').pop();

    if (ext === 'pdf') {
        return (
            <iframe
                src={fileUrl}
                title="PDF Preview"
                className="w-full h-full"
                style={{ minHeight: '120px', border: 'none', background: 'white' }}
            />
        );
    } else if (ext === 'doc' || ext === 'docx') {
        const googleViewer = `https://docs.google.com/gview?url=${fileUrl}&embedded=true`;
        return (
            <iframe
                src={googleViewer}
                title="Word Document"
                className="w-full h-full"
                style={{ minHeight: '120px', border: 'none', background: 'white' }}
            />
        );
    } else {
        return (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
               className="flex flex-col items-center text-blue-700 hover:underline text-lg font-semibold p-4 rounded-lg border-2 border-blue-200 bg-white shadow-md">
                <span role="img" aria-label="Document" className="text-5xl mb-2">📁</span>
                <span className="text-base truncate max-w-[180px]">{docUrl.split('/').pop()}</span>
                <span className="text-xs mt-1">Click to open or download</span>
            </a>
        );
    }
};

export default function ContentBroadcast() {
    const { name } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const socketRef = useRef<any>(null);

    // Fetch TV details by tv name
    const { data: tv, isLoading: isTvLoading } = useQuery({
        queryKey: ["tv", name],
        queryFn: async () => {
            const res = await fetch(`/api/tvs/${name}`, { credentials: "include" });
            if (!res.ok) throw new Error("TV not found");
            return res.json();
        },
        retry: false,
    });

    // Fetch all content
    const { data: allContent = [], isLoading: isContentLoading } = useQuery({
        queryKey: ["/api/content"],
        queryFn: async () => {
            const response = await fetch("/api/content", { credentials: "include" });
            return response.json();
        },
    });

    // Filter content that has this TV selected
    const availableContent = allContent.filter((content: any) =>
        content.selectedTvs && tv && content.selectedTvs.includes(tv.id)
    );

    // Socket.IO real-time updates
    useEffect(() => {
        // Initialize Socket.IO connection
        socketRef.current = io(window.location.origin, {
            path: "/socket.io",
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        const socket = socketRef.current;

        // Listen for content updates
        socket.on("content:created", (newContent: any) => {
            console.log("New content created:", newContent);
            // Check if the new content is assigned to this TV
            if (newContent.selectedTvs && newContent.selectedTvs.includes(tv?.id)) {
                queryClient.invalidateQueries({ queryKey: ["/api/content"] });
                toast({
                    title: "New Content Available",
                    description: `"${newContent.title}" has been added and is now available for broadcast`,
                    duration: 5000,
                });
            }
        });

        socket.on("content:updated", (updatedContent: any) => {
            console.log("Content updated:", updatedContent);
            // Check if the updated content is assigned to this TV
            if (updatedContent.selectedTvs && updatedContent.selectedTvs.includes(tv?.id)) {
                queryClient.invalidateQueries({ queryKey: ["/api/content"] });
                toast({
                    title: "Content Updated",
                    description: `"${updatedContent.title}" has been updated`,
                    duration: 3000,
                });
            }
        });

        socket.on("content:deleted", (deletedContent: any) => {
            console.log("Content deleted:", deletedContent);
            queryClient.invalidateQueries({ queryKey: ["/api/content"] });
            toast({
                title: "Content Removed",
                description: "Content has been removed from the system",
                duration: 3000,
            });
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [queryClient, toast, tv?.id]);

    // Fallback periodic refresh every 30 seconds as backup
    useEffect(() => {
        const interval = setInterval(() => {
            if (tv?.id) {
                queryClient.invalidateQueries({ queryKey: ["/api/content"] });
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [queryClient, tv?.id]);

    // Start broadcasting mutation
    const broadcastMutation = useMutation({
        mutationFn: ({ contentId }: { contentId: string[] }) =>
            apiRequest("POST", `/api/broadcast/${tv.name}`, { contentId, name: [tv.name] }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["/api/tvs"]});
            toast({
                title: "Success",
                description: "Broadcasting started successfully",
            });
            setTimeout(() => setLocation(`/display/${tv.name}`), 1000);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to start broadcasting",
                variant: "destructive",
            });
        },
    });

    const handleStartBroadcast = () => {
        if (availableContent.length === 0) {
            toast({
                title: "Error",
                description: "No content available to broadcast",
                variant: "destructive",
            });
            setTimeout(() => setLocation(`/display/${tv.name}`), 1000);
            return;
        }

        broadcastMutation.mutate({
            contentId: availableContent.map((c: any) => c.id),
        });
    };

    if (isTvLoading || !tv) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <Skeleton className="h-12 w-64 mb-6" />
                <Skeleton className="h-8 w-full mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Broadcast to {tv.name || "TV"}
                        </h1>
                        <p className="text-muted-foreground">
                            All available content will be broadcast to this TV
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setLocation("/tvs")}
                        className="mt-4 md:mt-0"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to TV Management
                    </Button>
                </div>

                {availableContent.length === 0 ? (
                    <Card>
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                <Info className="h-12 w-12 text-muted-foreground" />
                                <h3 className="text-xl font-medium">No content available</h3>
                                <p className="text-muted-foreground">
                                    This TV hasn't been selected for any content yet. Go to Content Management to
                                    create content and select this TV.
                                </p>
                                <Button onClick={() => setLocation("/content")}>
                                    Go to Content Management
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {availableContent.map((content: any) => (
                                <Card key={content.id}>
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-lg">{content.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {content.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        {content.videoUrl ? (
                                            <div className="aspect-video rounded-md overflow-hidden bg-muted">
                                                <video
                                                    src={getMediaUrl(content.videoUrl)}
                                                    className="w-full h-full object-cover"
                                                    style={{ objectFit: 'cover', width: '100%', height: '100%', background: 'black' }}
                                                    controls
                                                    preload="metadata"
                                                    onError={e => { (e.target as HTMLVideoElement).poster = 'https://placehold.co/600x400?text=No+Video'; }}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        ) : content.imageUrl ? (
                                            <div className="aspect-video rounded-md overflow-hidden bg-muted">
                                                <img
                                                    src={getMediaUrl(content.imageUrl)}
                                                    alt={content.title}
                                                    className="w-full h-full object-cover"
                                                    style={{ 
                                                        objectFit: 'cover',
                                                        width: '100%',
                                                        height: '100%',
                                                        minWidth: '100%',
                                                        minHeight: '100%'
                                                    }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                        ) : content.docUrl ? (
                                            <div className="aspect-video rounded-md overflow-hidden bg-muted flex flex-col items-center justify-center p-2">
                                                {renderDocument(content.docUrl)}
                                            </div>
                                        ) : (
                                            <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                                                <p className="text-muted-foreground">No image/video</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                                        <Badge>{content.status}</Badge>
                                        <p className="text-sm text-muted-foreground">
                                            Created by {content.username}
                                        </p>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleStartBroadcast}
                                disabled={availableContent.length === 0 || broadcastMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Play className="mr-2 h-4 w-4" />
                                {broadcastMutation.isPending ? "Starting Broadcast..." : "Start Broadcasting"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}