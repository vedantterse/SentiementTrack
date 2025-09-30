"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AuthError() {
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

            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-[#FF6A4D] border-4 border-black flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-bold text-2xl text-black mb-2">Authentication Error</h1>
              <p className="text-gray-600 font-medium">
                There was a problem signing you in. Please try again.
              </p>
            </div>

            {/* Possible Issues */}
            <div className="text-left bg-gray-50 border-2 border-black p-4 space-y-2">
              <h3 className="font-bold text-sm text-black">Possible issues:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You denied permission to access your YouTube data</li>
                <li>• Your Google account doesn't have a YouTube channel</li>
                <li>• Network connection issues</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/auth/signin">
                <Button className="w-full bg-[#7A3BFF] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold">
                  Try Again
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" className="w-full border-2 border-black font-bold">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}