"use client";

import { signIn, getProviders } from "next-auth/react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.replace(callbackUrl);
      return;
    }

    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, [isAuthenticated, router, callbackUrl]);

  const handleSignIn = async (providerId: string) => {
    try {
      await signIn(providerId, { 
        callbackUrl,
        redirect: true
      });
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3E8FF] to-[#E8F4FD] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-12 h-12 bg-[#7A3BFF] border-2 border-black flex items-center justify-center font-black text-white text-xl mx-auto animate-pulse">
                S
              </div>
              <p className="font-medium text-gray-600">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3E8FF] to-[#E8F4FD] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#7A3BFF] border-2 border-black flex items-center justify-center font-black text-white text-xl">
                S
              </div>
              <span className="font-black text-2xl text-black">SentimentTrack</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-bold text-2xl text-black mb-2">Connect Your YouTube</h1>
              <p className="text-gray-600 font-medium">
                Sign in with Google to access your YouTube analytics and insights
              </p>
            </div>

            {/* Sign In Button */}
            {providers && Object.values(providers).map((provider: any) => (
              <Button
                key={provider.name}
                onClick={() => handleSignIn(provider.id)}
                className="w-full bg-[#7A3BFF] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold py-4 text-lg"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            ))}

            {/* Features */}
            <div className="pt-6 space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-[#C8FF3D] font-bold">✓</span>
                <span>Access your YouTube analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#C8FF3D] font-bold">✓</span>
                <span>Analyze video sentiment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#C8FF3D] font-bold">✓</span>
                <span>Generate content insights</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}