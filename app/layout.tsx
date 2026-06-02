import type { Metadata } from "next";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import MainNavigation from "@/components/MainNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nordix Cockpit",
  description: "Dashboard voor Feel Nordix"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 rounded-lg bg-nordix-ink px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <span className="rounded-md bg-white px-3 py-2">
                <LogoMark
                  className="h-10 w-32"
                  fallbackClassName="text-base font-semibold text-nordix-ink"
                />
              </span>
              <span className="sr-only">Feel Nordix</span>
              <h1 className="text-2xl font-semibold tracking-normal text-white">
                Nordix Cockpit
              </h1>
            </Link>

            <MainNavigation />
          </header>

          <main className="flex-1 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
