"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthStatus() {
  const { data: session, status, update } = useSession();
  const [cookies, setCookies] = useState<string[]>([]);
  
  useEffect(() => {
    // Get all cookies for debugging
    setCookies(document.cookie.split(";").map(c => c.trim()));
  }, []);
  
  // Force a session refresh
  const refreshSession = () => {
    update(); // Manually update the session
  };
  
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="p-6 border rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-6">Authentication Status</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h2 className="text-xl font-semibold mb-2">Session Status</h2>
            <p className="mb-1"><span className="font-medium">Status:</span> {status}</p>
            <p className="mb-1"><span className="font-medium">Authenticated:</span> {status === "authenticated" ? "Yes ✅" : "No ❌"}</p>
          </div>
          
          {session && (
            <div className="p-4 bg-green-50 rounded">
              <h2 className="text-xl font-semibold mb-2">User Information</h2>
              <p className="mb-1"><span className="font-medium">ID:</span> {session.user.id}</p>
              <p className="mb-1"><span className="font-medium">Name:</span> {session.user.name || "Not set"}</p>
              <p className="mb-1"><span className="font-medium">Email:</span> {session.user.email || "Not set"}</p>
              <pre className="text-sm p-2 bg-white rounded mt-2 overflow-auto max-h-40">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="p-4 bg-blue-50 rounded">
            <h2 className="text-xl font-semibold mb-2">Session Cookies</h2>
            <p className="mb-2">Found {cookies.length} cookies:</p>
            <ul className="list-disc pl-5">
              {cookies.map((cookie, index) => (
                <li key={index} className="mb-1 break-all">
                  {cookie}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-8 flex gap-4">
          <Button onClick={refreshSession}>
            Refresh Session
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 