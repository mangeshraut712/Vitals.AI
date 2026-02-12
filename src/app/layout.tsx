import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vitals.AI — Privacy-First Health Dashboard",
    template: "%s | Vitals.AI",
  },
  description:
    "AI-powered health dashboard with biomarker analysis, biological age tracking, and digital twin visualization. Your data never leaves your machine.",
  keywords: [
    "health dashboard",
    "biomarkers",
    "biological age",
    "PhenoAge",
    "health tracking",
    "AI health",
    "privacy-first",
    "digital twin",
  ],
  authors: [{ name: "OpenHealth Contributors" }],
  openGraph: {
    title: "Vitals.AI — Privacy-First Health Dashboard",
    description:
      "AI-powered health dashboard with biomarker analysis, biological age tracking, and digital twin visualization.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: false, // localhost app, no indexing
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              className: "vitals-card",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
