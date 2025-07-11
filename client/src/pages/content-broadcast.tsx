// content-broadcast.tsx
import { useEffect } from "react";
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

export default function ContentBroadcast() {
    const { tvId } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch TV details
    const { data: tv, isLoading: isTvLoading } = useQuery({
        queryKey: [`/api/tvs/${tvId}`],
        queryFn: async () => {
            const response = await fetch(`/api/tvs/${tvId}`, { credentials: "include" });
            return response.json();
        },
    });

    // Fetch all content that has this TV in its selectedTvs array
    const { data: allContent = [], isLoading: isContentLoading } = useQuery({
        queryKey: ["/api/content"],
        queryFn: async () => {
            const response = await fetch("/api/content", { credentials: "include" });
            return response.json();
        },
    });

    // Filter content that has this TV selected
    const availableContent = allContent.filter((content: any) =>
        content.selectedTvs && content.selectedTvs.includes(tvId as string)
    );

    // Start broadcasting mutation
    const broadcastMutation = useMutation({
        mutationFn: ({ contentId, tvIds }: { contentId: string[]; tvIds: string[] }) =>
            apiRequest("POST", "/api/broadcast", { contentId, tvIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tvs"] });
            toast({
                title: "Success",
                description: "Broadcasting started successfully",
            });
            setTimeout(() => setLocation(`/display/${tvId}`), 1000); // Ensure tvId is valid
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
            setTimeout(() => setLocation(`/display/${tvId}`), 1000);
            return;
        }

        // Broadcast all available content IDs
        broadcastMutation.mutate({
            contentId: availableContent.map((c: any) => c.id),
            tvIds: [tvId as string]
        });
    };

    if (isTvLoading) {
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
                            Broadcast to {tv?.name || "TV"}
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
                                        {content.imageUrl ? (
                                            <div className="aspect-video rounded-md overflow-hidden bg-muted">
                                                <img
                                                    src={content.imageUrl}
                                                    alt={content.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                                                <p className="text-muted-foreground">No image</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                                        <Badge>{content.status}</Badge>
                                        <p className="text-sm text-muted-foreground">
                                            Created by {content.createdBy}
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