import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rent My Gear — Renta de Equipo Premium",
  description:
    "Renta cámaras, equipo de montaña y deportes acuáticos de alta calidad al mejor precio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="text-xl font-bold tracking-tight text-neutral-900">
              Rent My Gear
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
              <Link href="/category/fotografia-video" className="hover:text-neutral-900 transition-colors">
                Fotografía
              </Link>
              <Link href="/category/montana-camping" className="hover:text-neutral-900 transition-colors">
                Montaña
              </Link>
              <Link href="/category/deportes-acuaticos" className="hover:text-neutral-900 transition-colors">
                Acuático
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>

        <footer className="border-t border-neutral-200 bg-neutral-50 py-8 text-center text-sm text-neutral-400">
          © {new Date().getFullYear()} Rent My Gear. Todos los derechos reservados.
        </footer>

        <Toaster />
      </body>
    </html>
  );
}
