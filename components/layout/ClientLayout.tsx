"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Header from "./Header";
import Footer from "./Footer";
import MobileNavigation from "./MobileNavigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useNotificationsWebSocket } from "@/hooks/useNotificationsWebSocket";

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col min-h-screen relative">
          <Header />
          <main className="flex-grow pb-16 md:pb-0">{children}</main>
          <Footer />
        </div>
        
        {/* Mobile navigation moved outside main layout to prevent positioning conflicts */}
        <MobileNavigation />
        
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default ClientLayout; 