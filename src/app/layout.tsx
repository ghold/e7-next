import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E7 GEAR // 装备分析系统",
  description: "Epic Seven Equipment Analyzer — Tactical Gear Evaluation Terminal",
};

// Inline script to prevent flash of wrong theme (FOUC)
const themeScript = `try{var t=localStorage.getItem('e7-theme');if(t==='light')document.documentElement.classList.remove('dark')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <footer className="mt-auto border-t border-border/40 bg-background/80">
            <div className="container mx-auto flex h-9 items-center justify-center px-4 gap-3">
              <span className="text-[10px] font-mono text-steel-500 tracking-wider uppercase">E7 GEAR ANALYSIS SYSTEM © {new Date().getFullYear()}</span>
              <span className="text-[10px] font-mono text-steel-600">·</span>
              <span className="text-[10px] font-mono text-steel-500 tracking-wider uppercase">POWERED BY</span>
              <a
                href="https://www.e7bot.top/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-gold-500 hover:text-gold-300 tracking-wider uppercase transition-colors"
              >
                百里机器人
              </a>
            </div>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
