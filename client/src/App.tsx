import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import VerifyEmail from "@/components/VerifyEmail";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import TvManagement from "@/pages/tv-management";
import ContentManagement from "@/pages/content-management";
import UserManagement from "@/pages/user-management";
import Settings from "@/pages/settings";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";

// Layout components
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import React, { useEffect, useRef } from "react";
import ContentBroadcast from "@/pages/content-broadcast.tsx";
import ContentDisplay from "@/pages/content-display.tsx";
import Register from "@/pages/register.tsx";
import { Button } from "react-day-picker";
import { io } from "socket.io-client";
import { socketConfig } from "@/macConfig.ts";
import { useToast } from "@/hooks/use-toast.ts";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Redirect to="/login" />;
    }

    return <>{children}</>;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="pl-64">
                <TopBar title={title} subtitle={subtitle} />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}

function Router() {
    const { isAuthenticated } = useAuth();

    return (
        <Switch>
            <Route path="/login">
                {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
            </Route>
            <Route path="/dashboard">
                <ProtectedRoute>
                    <DashboardLayout
                        title="Dashboard"
                        subtitle="Welcome back! Here's what's happening with your TV network."
                    >
                        <Dashboard />
                    </DashboardLayout>
                </ProtectedRoute>
            </Route>
            <Route path="/tvs">
                <ProtectedRoute>
                    <DashboardLayout
                        title="TV Management"
                        subtitle="Manage your TV devices and their configurations"
                    >
                        <TvManagement />
                    </DashboardLayout>
                </ProtectedRoute>
            </Route>
            <Route path="/content">
                <ProtectedRoute>
                    <DashboardLayout
                        title="Content Management"
                        subtitle="Manage your content library and broadcasting schedules"
                    >
                        <ContentManagement />
                    </DashboardLayout>
                </ProtectedRoute>
            </Route>
            <Route path="/users">
                <ProtectedRoute>
                    <DashboardLayout
                        title="User Management"
                        subtitle="Manage user accounts and permissions"
                    >
                        <UserManagement />
                    </DashboardLayout>
                </ProtectedRoute>
            </Route>
            <Route path="/verify-email">
                <VerifyEmail />
            </Route>
            <Route path="/broadcast/:name">
                <ContentBroadcast />
            </Route>
            <Route path="/display/:name">
                <ContentDisplay />
            </Route>
            <Route path="/settings">
                <ProtectedRoute>
                    <DashboardLayout
                        title="Settings"
                        subtitle="Manage your account and application preferences"
                    >
                        <Settings />
                    </DashboardLayout>
                </ProtectedRoute>
            </Route>
            <Route path="/forgot-password">
                <ForgotPassword />
            </Route>
            <Route path="/reset-password">
                <ResetPassword />
            </Route>
            <Route path="/register">
                <Register />
            </Route>
            <Route path="/">
                {isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
            </Route>
            <Route>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground">404 - Page Not Found</h1>
                        <p className="text-muted-foreground mt-2">The page you are looking for does not exist.</p>
                        <Button onClick={() => (window.location.href = "/dashboard")} className="mt-4">
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </Route>
        </Switch>
    );
}

function App() {
    const { toast } = useToast();
    const socketRef = useRef<any>(null); // Use ref to persist socket instance

    useEffect(() => {
        // Initialize Socket.IO with configuration from macConfig.ts
        socketRef.current = io(window.location.origin, {
            ...socketConfig,
            path: "/socket.io",
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("Connected to Socket.IO server");
        });
        socket.on("connect_error", (error: Error) => {
            console.error("Socket.IO connection error:", error.message);
        });
        socket.on("broadcast", (data: unknown) => {
            console.log("Broadcast received:", data);
        });
        return () => {
            socket.disconnect();
        }
    }, []);
    useEffect(() => {
        const socket = socketRef.current;

        socket.on("activity", (newActivity: { message?: string; }) => {
            let variant: "default" | "success" | "destructive" = "default";
            let style: React.CSSProperties | undefined = undefined;
            const msg = newActivity.message ? newActivity.message.toLowerCase() : "";

            if (msg.includes("created")) {
                variant = "success";
            } else if (msg.includes("updated")) {
                variant = "default";
                style = { backgroundColor: "#facc15", color: "#78350f" };
            } else if (msg.includes("deleted")) {
                variant = "destructive";
            }
            toast({
                title: "Activity",
                description: newActivity.message || "No message",
                variant,
                duration: 5000,
            });
        });

        socket.on("connect_error", (error: { message: string | string[]; }) => {
            console.error("WebSocket connection error:", error.message);
            if (error.message.includes("auth")) {
                console.log("Authentication failed, check macAddress:", socketConfig.auth.macAddress);
            }
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [toast]);

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Router />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;