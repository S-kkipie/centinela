import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Providers } from "@/frontend/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
    title: "Hackaton Starter",
    description: "Next + Elysia + Better Auth + Drizzle starter",
};

export default function RootLayout({ children }: PropsWithChildren) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-svh antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
