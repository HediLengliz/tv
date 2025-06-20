// client/src/components/VerifyEmail.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const VerifyEmail = () => {
    const [location, setLocation] = useLocation();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');
    const { isAuthenticated } = useAuth();

    // Parse search params manually from location
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. Token is missing.');
                return;
            }

            try {
                // Use the GET endpoint for verification
                await apiRequest('GET', `/api/verify-email?token=${token}`);
                setStatus('success');
                setMessage('Your email has been verified successfully!');

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    if (isAuthenticated) {
                        setLocation('/dashboard');
                    } else {
                        setLocation('/login');
                    }
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error instanceof Error ? error.message : 'Failed to verify email. Please try again.');
            }
        };

        verifyEmail();
    }, [token, isAuthenticated, setLocation]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 space-y-6 bg-white">
                <div className="text-center">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold mb-2">Verifying Email</h2>
                            <p className="text-gray-500">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4 animate-success" />
                            <h2 className="text-2xl font-semibold mb-2 animate-fade-in">Verification Successful</h2>
                            <p className="text-gray-500 animate-fade-in">{message}</p>
                            <p className="text-sm text-gray-400 mt-4 animate-fade-in">
                                Redirecting you to {isAuthenticated ? 'dashboard' : 'login'} in a few seconds...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold mb-2">Verification Failed</h2>
                            <p className="text-gray-500">{message}</p>
                            <Button
                                className="mt-4"
                                onClick={() => setLocation('/login')}
                            >
                                Go to Login
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default VerifyEmail;
