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

// Layout components
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import React from "react";
import ContentBroadcast from "@/pages/content-broadcast.tsx";

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
        <main className="p-6">
          {children}
        </main>
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
        <Route path="/broadcast/:tvId">
            <ContentBroadcast />
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

      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
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
