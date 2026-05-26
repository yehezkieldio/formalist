"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

const storageKey = "formalist-theme";

function applyTheme(theme: string | null) {
    const dark = theme === "dark";

    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        applyTheme(window.localStorage.getItem(storageKey));

        const handleStorage = (event: StorageEvent) => {
            if (event.key === storageKey) {
                applyTheme(event.newValue);
            }
        };

        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    return children;
}
