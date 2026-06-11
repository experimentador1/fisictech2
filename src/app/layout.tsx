import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { ExerciseSeeder } from "@/components/providers/exercise-seeder";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FisicTech - Plataforma Educativa",
  description: "Plataforma de entrenamiento inteligente con detección de poses en tiempo real mediante visión por computadora.",
  keywords: ["educación física", "pilates", "detección de poses", "Next.js", "TypeScript", "MediaPipe"],
  authors: [{ name: "FisicTech" }],
  creator: "FisicTech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950">
        <ExerciseSeeder />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
