"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ConnectAccountButtonProps {
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "lg" | "default";
  variant?: "default" | "outline";
  authenticatedText?: string;
  unauthenticatedText?: string;
}

export function ConnectAccountButton({
  children,
  className = "",
  size = "default",
  variant = "default",
  authenticatedText = "Go to Dashboard",
  unauthenticatedText = "Connect Account"
}: ConnectAccountButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = async () => {
    if (status === 'loading') {
      return; // Do nothing while loading
    }

    if (status === 'authenticated' && session?.user) {
      // User is authenticated, go to dashboard
      setIsRedirecting(true);
      router.replace('/dashboard');
    } else {
      // User not authenticated, start OAuth
      const authUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent('/dashboard')}`;
      window.location.href = authUrl;
    }
  };

  const buttonText = children || (
    status === 'authenticated' && session?.user 
      ? authenticatedText 
      : unauthenticatedText
  );

  const isLoading = status === 'loading' || isRedirecting;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant={variant}
      className={className}
    >
      {isLoading ? 'Loading...' : buttonText}
    </Button>
  );
}