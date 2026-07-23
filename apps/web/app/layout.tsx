import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/Navbar";

export const metadata: Metadata = {
  title: "Fixsi — Serviços e Ferramentas",
  description: "Contrate serviços autônomos e alugue ferramentas com segurança",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-white min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}