import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter_Tight, Space_Grotesk } from "next/font/google";
import type { PropsWithChildren } from "react";
import { Providers } from "@/frontend/providers/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["500", "700"],
    variable: "--font-space-grotesk",
});

const interTight = Inter_Tight({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-plex-mono",
});

export const metadata: Metadata = {
    title: "Centinela — vigilancia autónoma de la contratación pública",
    description:
        "Agente autónomo que vigila SECOP vía Croma: oportunidades para PYMEs, banderas rojas con evidencia citada.",
};

export default function RootLayout({ children }: PropsWithChildren) {
    return (
        <html lang="es-CO" suppressHydrationWarning>
            <body
                className={`${spaceGrotesk.variable} ${interTight.variable} ${plexMono.variable} min-h-svh antialiased`}
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
