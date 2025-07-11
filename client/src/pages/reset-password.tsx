import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/card"; // <-- Fix import: use named import

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate token exists
        if (!token) {
            setError("Missing reset token. Please request a new password reset link.");
            return;
        }

        // Validate passwords match
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            // Log the token (for debugging)
            console.log("Submitting reset with token:", token);

            const response = await apiRequest("POST", "/api/reset-password", {
                token: token.trim(), // Ensure no whitespace
                password
            });

            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                setLocation("/login");
            }, 3000);
        } catch (err: any) {
            setLoading(false);
            setError(err?.message || "Failed to reset password");
        }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="max-w-md w-full p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
        {loading && !success ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
            <p className="text-muted-foreground">Resetting your password...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="h-10 w-10 text-green-600 mb-4" />
            <p className="text-green-700 font-semibold mb-2">Password reset successfully!</p>
            <p className="text-muted-foreground text-center">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              type="password"
              placeholder="New password"
              value={password}
              required
              onChange={e => setPassword(e.target.value)}
              className="mb-3"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              required
              onChange={e => setConfirm(e.target.value)}
              className="mb-4"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              Reset Password
            </Button>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </form>
        )}
      </Card>
    </div>
  );
}
