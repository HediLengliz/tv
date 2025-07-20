import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useEffect, useRef, useState } from "react";

export default function ContentDisplay() {
    const { name } = useParams();
    const [, setLocation] = useLocation();

    const { data: tv, isLoading: isTvLoading } = useQuery({
        queryKey: ["tv", name],
        queryFn: async () => {
            const res = await fetch(`/api/tvs/${name}`, { credentials: "include" });
            if (!res.ok) throw new Error("TV not found");
            return res.json();
        },
        retry: false,
    });

    const { data: allContent = [], isLoading: isContentLoading } = useQuery({
        queryKey: ["content"],
        queryFn: async () => {
            const res = await fetch("/api/content", { credentials: "include" });
            return res.json();
        },
        enabled: !!tv,
    });

    const availableContent = tv
        ? allContent.filter((content: any) =>
            content.selectedTvs?.includes(tv.id)
        )
        : [];

    // Debug logs
    useEffect(() => {
        console.log("tv.id", tv?.id);
        console.log("allContent", allContent);
        console.log("availableContent", availableContent);
    }, [tv, allContent, availableContent]);

    // Extra debug logs for availableContent items
    useEffect(() => {
        if (availableContent.length > 0) {
            availableContent.forEach((item: any, idx: any) => {
                console.log(`availableContent[${idx}]`, item);
            });
        }
    }, [availableContent]);

    // Carousel autoplay logic
    const [current, setCurrent] = useState(0);
    const carouselApiRef = useRef<any>(null);
    useEffect(() => {
        if (!availableContent.length) return;
        const duration = availableContent[current]?.duration || 15;
        const timer = setTimeout(() => {
            setCurrent((prev) => (prev + 1) % availableContent.length);
        }, duration * 1000);
        // Move carousel to current
        if (carouselApiRef.current) {
            carouselApiRef.current.scrollTo(current);
        }
        return () => clearTimeout(timer);
    }, [current, availableContent]);

    // Helper to get absolute media URL
    const getMediaUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${window.location.origin}${url}`;
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

    // Remove AnimatedBackground and use a solid white background
    return (
        <div className="min-h-screen bg-white">
            {availableContent.length > 0 && (
                <div className="fixed inset-0 w-full h-full z-10 flex items-center justify-center bg-white">
                    <Carousel
                        className="w-full h-full"
                        opts={{ loop: true }}
                        setApi={(api) => (carouselApiRef.current = api)}
                    >
                        <CarouselContent className="h-full">
                            {availableContent.map((content: any, idx: number) => (
                                <CarouselItem key={content.id} className="h-full w-full flex items-center justify-center relative">
                                    {content.imageUrl ? (
                                        <img
                                            src={getMediaUrl(content.imageUrl)}
                                            alt={content.title}
                                            className="object-cover w-full h-full"
                                            style={{ objectFit: "cover" }}
                                            onError={e => { e.currentTarget.src = 'https://placehold.co/1920x1080?text=No+Image'; }}
                                        />
                                    ) : content.videoUrl ? (
                                        <video
                                            src={getMediaUrl(content.videoUrl)}
                                            autoPlay
                                            loop
                                            muted
                                            className="object-cover w-full h-full"
                                            style={{ objectFit: "cover" }}
                                            onError={e => { e.currentTarget.poster = 'https://placehold.co/1920x1080?text=No+Video'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-yellow-300 text-4xl font-bold">
                                            NO IMAGE/VIDEO
                                        </div>
                                    )}
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            )}
            {/* Hide the rest of the page when carousel is active */}
            {availableContent.length === 0 && (
                <div className="max-w-5xl mx-auto p-8">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Now Playing on {tv.name}</h1>
                            <p className="text-muted-foreground">Content assigned to this TV</p>
                        </div>
                        <Button variant="outline" onClick={() => setLocation("/tvs")}> <ArrowLeft className="mr-2 h-4 w-4" /> Back </Button>
                    </div>
                    {isContentLoading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <h3 className="text-xl font-medium">No content assigned</h3>
                                <p className="text-muted-foreground">Go to Content Management to add.</p>
                                <Button onClick={() => setLocation("/content")} className="mt-4">Go to Content</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
