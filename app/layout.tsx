import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PRD",
  description: "Transform any idea into a complete Product Requirements Document using AI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
