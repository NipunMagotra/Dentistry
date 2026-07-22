import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import packageJson from "../../package.json";
import { OfflineSyncBanner } from "@/components/OfflineSyncBanner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinic OS - Multi-Tenant Medical Platform",
  description: "Manage your entire clinic offline & online from one place.",
  manifest: "/manifest.json",
  themeColor: "#0284c7"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col relative bg-background text-foreground transition-colors duration-300">
        <OfflineSyncBanner />
        {children}
        <div className="fixed bottom-2 right-2 text-[10px] text-muted-foreground/60 font-mono select-none pointer-events-none z-50 print:hidden">
          v{packageJson.version}
        </div>
      </body>
    </html>
  );
}
