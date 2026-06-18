"use client";

import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reso LMS — Learning Management System</title>
        <meta
          name="description"
          content="Comprehensive institutional learning management platform for courses, assignments, quizzes, and certifications."
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: "Arial, sans-serif",
                  fontSize: "14px",
                  borderRadius: "6px",
                  padding: "12px 16px",
                },
                success: {
                  iconTheme: {
                    primary: "#059669",
                    secondary: "#ffffff",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#DC2626",
                    secondary: "#ffffff",
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
