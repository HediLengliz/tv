import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "wouter";
import useEmblaCarousel from "embla-carousel-react";
import { apiRequest } from "@/lib/queryClient";
import { Content } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RouteParams {
    tvId: string;
}

export default function ContentDisplay() {
    const { tvId } = useParams<RouteParams>();
    const [playlist, setPlaylist] = useState<Content[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch playlist for the TV
    useEffect(() => {
        async function fetchPlaylist() {
            try {
                const broadcasts = await apiRequest("GET", `/api/broadcasts/${tvId}`);
                const contentIds = broadcasts.map((b: any) => b.contentId);
                const contentList = await Promise.all(
                    contentIds.map(async (id: string) => {
                        try {
                            const content = await apiRequest("GET", `/api/content/${id}`);
                            if (typeof content.duration !== 'number' || content.duration < 1) {
                                console.warn(`Content ${id} has invalid duration: ${content.duration}, setting to 15`);
                                return { ...content, duration: 15 };
                            }
                            return content;
                        } catch (error) {
                            console.error(`Failed to fetch content ${id}:`, error);
                            return null;
                        }
                    })
                );
                const validContent = contentList.filter((item) => item !== null) as Content[];
                // Remove duplicates by id
                const uniqueContentMap = new Map();
                validContent.forEach(item => {
                    if (item && item.id && !uniqueContentMap.has(item.id)) {
                        uniqueContentMap.set(item.id, item);
                    }
                });
                const uniqueContent = Array.from(uniqueContentMap.values());
                if (uniqueContent.length === 0) {
                    console.warn("No valid content found for TV:", tvId);
                } else {
                    console.log("Playlist:", uniqueContent.map(item => ({ id: item.id, duration: item.duration })));
                }
                setPlaylist(uniqueContent);
            } catch (error) {
                console.error("Failed to fetch broadcasts:", error);
                setPlaylist([]);
            }
        }
        if (tvId) fetchPlaylist();
    }, [tvId]);

    // Auto-advance logic based on each content's duration
    useEffect(() => {
        if (!playlist.length || !emblaApi) return;
        const duration = playlist[currentIndex]?.duration || 15;
        console.log(`Setting timeout for content ${currentIndex}: ${duration} seconds`);
        timerRef.current && clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            console.log(`Advancing to next content: ${currentIndex + 1}`);
            const nextIndex = (currentIndex + 1) % playlist.length;
            emblaApi.scrollTo(nextIndex, true);
            setCurrentIndex(nextIndex);
        }, duration * 1000);
        return () => {
            timerRef.current && clearTimeout(timerRef.current);
        };
    }, [currentIndex, playlist, emblaApi]);

    // Embla: sync currentIndex with Embla's selected index
    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => {
            const newIndex = emblaApi.selectedScrollSnap();
            if (newIndex !== currentIndex) {
                console.log(`Manual scroll to content: ${newIndex}`);
                setCurrentIndex(newIndex);
            }
        };
        emblaApi.on("select", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi, currentIndex]);

    const handlePrev = useCallback(() => {
        if (emblaApi) {
            console.log("Navigating to previous content");
            emblaApi.scrollPrev();
        }
    }, [emblaApi]);

    const handleNext = useCallback(() => {
        if (emblaApi) {
            console.log("Navigating to next content");
            emblaApi.scrollNext();
        }
    }, [emblaApi]);

    if (!playlist.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-teal-900 to-gold-800">
                <span className="text-lg text-gray-300">No content to display.</span>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{
                background: `linear-gradient(120deg, #2a004a 0%, #006666 50%, #d4a017 100%)`,
            }}
        >
            {/* Animated Blobs Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="blob blob1"></div>
                <div className="blob blob2"></div>
                <div className="blob blob3"></div>
            </div>
            <div
                className="w-full max-w-4xl relative z-10 p-6 rounded-2xl shadow-lg"
                style={{
                    backdropFilter: "blur(12px)",
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    boxShadow: "0 0 20px rgba(0, 255, 191, 0.3)",
                    transition: "all 0.3s ease",
                }}
            >
                <div
                    className="embla__container flex"
                    ref={emblaRef}
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                        transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
                    }}
                >
                    {playlist.map((item, idx) => (
                        <div
                            className="embla__slide flex-shrink-0 w-full transition-all duration-700"
                            key={item.id}
                            style={{
                                opacity: currentIndex === idx ? 1 : 0.7,
                                transform: currentIndex === idx ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            <div className="flex flex-col items-center justify-center h-[70vh] p-4 bg-gray-900/50 rounded-xl shadow-2xl">
                                {item.videoUrl ? (
                                    <video
                                        src={item.videoUrl}
                                        controls
                                        autoPlay
                                        loop
                                        className="max-h-[60vh] rounded-lg shadow-md"
                                    />
                                ) : item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="max-h-[60vh] rounded-lg shadow-md object-cover"
                                    />
                                ) : (
                                    <div className="text-white text-xl">No media available</div>
                                )}
                                <div className="mt-4 text-center">
                                    <h2 className="text-2xl font-bold text-teal-300">{item.title}</h2>
                                    <p className="text-gray-200">{item.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center mt-6">
                    <div className="w-full max-w-[80%] h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-teal-400 to-pink-400 transition-all duration-700 ease-out"
                            style={{
                                width: `${((currentIndex + 1) / playlist.length) * 100}%`,
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .blob {
                        position: absolute;
                        border-radius: 50%;
                        opacity: 0.45;
                        filter: blur(32px);
                        mix-blend-mode: lighten;
                        animation: blobMove 18s infinite alternate ease-in-out;
                    }
                    .blob1 {
                        width: 420px;
                        height: 420px;
                        background: linear-gradient(135deg, #00ffbf 0%, #ff69b4 100%);
                        top: -120px;
                        left: -120px;
                        animation-delay: 0s;
                    }
                    .blob2 {
                        width: 340px;
                        height: 340px;
                        background: linear-gradient(135deg, #d4a017 0%, #2a004a 100%);
                        bottom: -100px;
                        right: -100px;
                        animation-delay: 4s;
                    }
                    .blob3 {
                        width: 260px;
                        height: 260px;
                        background: linear-gradient(135deg, #006666 0%, #ff69b4 100%);
                        top: 40%;
                        left: 60%;
                        animation-delay: 8s;
                    }
                    @keyframes blobMove {
                        0% {
                            transform: scale(1) translate(0, 0) rotate(0deg);
                        }
                        33% {
                            transform: scale(1.15) translate(40px, -30px) rotate(20deg);
                        }
                        66% {
                            transform: scale(0.95) translate(-30px, 40px) rotate(-15deg);
                        }
                        100% {
                            transform: scale(1) translate(0, 0) rotate(0deg);
                        }
                    }
                    .embla__slide {
                        transition: opacity 0.7s ease-in-out, transform 0.7s ease-in-out;
                    }
                `}
            </style>
        </div>
    );
}