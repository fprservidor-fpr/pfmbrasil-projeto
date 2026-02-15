import "./globals.css";
import { ReactNode } from "react";
import { VisualEditsMessenger } from "orchids-visual-edits";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { SecurityProtection } from "@/components/SecurityProtection";
import { AveroFooter } from "@/components/AveroFooter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-hide" suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen scrollbar-hide" suppressHydrationWarning>

        <SecurityProtection />
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="19a6f9c7-7e81-43c3-a711-2a0bb789c49c"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
            <AuthProvider>
              <div className="flex-1 flex flex-col">
                {children}
              </div>
              <Toaster 

              position="top-right"
              toastOptions={{
                className: "modern-2026-toast",
                style: {
                  background: 'rgba(9, 9, 11, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                },
              }}
            />
          </AuthProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
