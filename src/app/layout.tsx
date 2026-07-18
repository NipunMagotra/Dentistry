import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import packageJson from "../../package.json";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinic OS - Multi-Tenant Medical Platform",
  description: "Manage your entire clinic from one place.",
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
    >
      <body className="min-h-full flex flex-col relative">
        {children}
        <div className="fixed bottom-2 right-2 text-[10px] text-slate-400/80 font-mono select-none pointer-events-none z-50 print:hidden">
          v{packageJson.version}
        </div>
      </body>
    </html>
  );
}
