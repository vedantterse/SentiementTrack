import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

interface AuthService {
  session: any;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  isLoading: boolean;
  connectAccount: () => Promise<void>;
  logout: () => Promise<void>;
  user: any;
}

export function useAuth(): AuthService {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectAccount = useCallback(async () => {
    try {
      setIsConnecting(true);

      // Wait for session to load if it's still loading
      if (status === 'loading') {
        console.log('Session still loading, waiting...');
        // Wait for session state to resolve
        setTimeout(() => {
          connectAccount();
        }, 500);
        return;
      }

      // If already authenticated with valid session, go directly to dashboard
      if (status === 'authenticated' && session?.user) {
        console.log('User already authenticated, navigating to dashboard');
        // Use replace to avoid history pollution
        router.replace('/dashboard');
        return;
      }

      // User is not authenticated, start popup-based OAuth flow
      console.log('User not authenticated, starting popup OAuth flow');
      await initiatePopupOAuth();

    } catch (error) {
      console.error('Error in connectAccount:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [session, status, router]);

  const initiatePopupOAuth = useCallback(async () => {
    try {
      // Create popup window for OAuth
      const popup = window.open('', 'oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        // Fallback to redirect if popup blocked
        console.log('Popup blocked, falling back to redirect');
        const result = await signIn('google', { 
          redirect: false,
          callbackUrl: '/dashboard'
        });
        
        if (result?.url) {
          window.location.href = result.url;
        }
        return;
      }

      // Use NextAuth with popup
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.ok) {
        // OAuth was successful, manually navigate to dashboard
        console.log('OAuth successful, navigating to dashboard');
        router.replace('/dashboard');
      } else if (result?.error) {
        console.error('OAuth error:', result.error);
        throw new Error(result.error);
      } else if (result?.url) {
        // Handle redirect URL in popup
        popup.location.href = result.url;
        
        // Monitor popup for completion
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            setTimeout(() => {
              window.location.reload(); // Refresh to get new session
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      // Show user-friendly error message
      alert('Authentication failed. Please try again.');
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await signOut({ 
        redirect: false  // Prevent automatic redirect
      });
      
      // Manually navigate to home to avoid history issues
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading' || isConnecting;

  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    connectAccount,
    logout,
    user: session?.user
  };
}

// Hook for immediate session checking without waiting
export function useImmediateAuth() {
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status !== 'loading') {
      setIsReady(true);
    }
  }, [status]);

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  
  return {
    isAuthenticated,
    isReady,
    session,
    status
  };
}

// Session validation utility
export function validateSession(session: any): boolean {
  if (!session) return false;
  
  // Check if session has required properties
  if (!session.user || !session.accessToken) return false;
  
  // Check if token is expired
  if (session.expiresAt && Date.now() > session.expiresAt * 1000) {
    console.log('Session token expired');
    return false;
  }
  
  return true;
}