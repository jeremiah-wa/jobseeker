import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/auth-context";

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
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
