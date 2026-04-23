import "@/lib/polyfills";
import type React from "react";
import "@/styles/globals.css";
import { Geist_Mono, Instrument_Serif } from "next/font/google";
import LocalFont from "next/font/local";
import { ThemeProvider } from "@/components/layouts/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
});

const clashGrotesk = LocalFont({
  src: "../public/fonts/ClashGrotesk-Variable.woff2",
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Make3D - SVG to 3D in Seconds",
  description: "Transform any SVG into a stunning 3D model. Customize materials, lighting, and export in seconds. No code. No installs.",
  openGraph: {
    title: "Make3D - SVG to 3D in Seconds",
    description: "Transform any SVG into a stunning 3D model. Customize materials, lighting, and export in seconds. No code. No installs.",
    url: "https://make3d.app/",
    siteName: "Make3D",
    images: [
      {
        url: "/opengraph-image-v1.png",
        width: 1200,
        height: 675,
        alt: "Make3D - SVG to 3D in Seconds",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Make3D - SVG to 3D in Seconds",
    description: "Transform any SVG into a stunning 3D model. Customize materials, lighting, and export in seconds.",
    images: ["/twitter-image-v1.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
          defer
        /> */}
        <script
          src="https://cloud.umami.is/script.js"
          defer
          data-website-id="237f1de7-ab04-44dd-a7b4-6b0b819b7991"
        />
      </head>
      <body
        className={cn(
          clashGrotesk.className,
          instrumentSerif.variable,
          geistMono.variable,
          "overflow-x-hidden",
        )}
        suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          {children}
          <Analytics />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
