import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";
import { useLocation } from "wouter";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [, setLocation] = useLocation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await apiRequest("POST", "/api/forgot-password", { email });
            setSent(true);
        } catch (err: any) {
            setError(err?.message || "Failed to send reset link");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
            {sent ? (
                <div>
                    <p className="mb-4">If an account exists for <b>{email}</b>, a reset link has been sent.</p>
                    <Button onClick={() => setLocation("/login")}>Back to Login</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        required
                        onChange={e => setEmail(e.target.value)}
                        className="mb-4"
                    />
                    <Button type="submit" className="w-full">Send Reset Link</Button>
                    {error && <div className="text-red-500 mt-2">{error}</div>}
                </form>
            )}
        </div>
    );
}

