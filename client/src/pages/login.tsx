import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const result = await apiRequest("POST", "/api/auth/login", data);
      login(result.user);
      toast({
        title: "Login successful",
        description: result.message,
        variant: "default",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6"
        >
          <h2 className="text-2xl font-bold mb-4">Sign in to your account</h2>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
                id="email"
                type="email"
                {...form.register("email")}
                disabled={isLoading}
                required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
                id="password"
                type="password"
                {...form.register("password")}
                disabled={isLoading}
                required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="flex justify-between text-sm mt-2">
            <a href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </a>
            <a href="/register" className="text-primary hover:underline">
              Register
            </a>
          </div>
        </form>
      </div>
  );
}