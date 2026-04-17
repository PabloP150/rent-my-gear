import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Rent my Gear",
  description: "Marketplace premium de renta de equipo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="border-b">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Rent my Gear
            </Link>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/category/fotografia-video" className="hover:text-foreground">
                Foto y Video
              </Link>
              <Link href="/category/montana-camping" className="hover:text-foreground">
                Montaña
              </Link>
              <Link href="/category/deportes-acuaticos" className="hover:text-foreground">
                Acuáticos
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mt-16 border-t">
          <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Rent my Gear
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
