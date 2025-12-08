import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { Toaster } from "@/lib/components/ui/toaster";
import { TooltipProvider } from "@/lib/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Jobseeker",
  description: "AI-enhanced job search application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryProvider>
          <TooltipProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
