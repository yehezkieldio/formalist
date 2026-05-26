import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "#/components/theme-provider";

import "./globals.css";

const geistSans = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-geist-mono",
});

const themeScript = `
(function() {
    try {
        var theme = window.localStorage.getItem("formalist-theme");
        var dark = theme === "dark";
        document.documentElement.classList.toggle("dark", dark);
        document.documentElement.style.colorScheme = dark ? "dark" : "light";
    } catch (_) {}
})();
`;

export const metadata: Metadata = {
    description:
        "Agentic RAG assistant for air cargo tariff and pricelist documents.",
    title: "Formalist",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <head>
                <script
                    dangerouslySetInnerHTML={{ __html: themeScript }}
                    suppressHydrationWarning
                />
            </head>
            <body className="flex min-h-full flex-col">
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
