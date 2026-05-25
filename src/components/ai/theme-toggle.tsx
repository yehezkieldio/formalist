"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "#/components/ui/button";

const storageKey = "formalist-theme";

export function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem(storageKey);
        const nextDark =
            storedTheme === "dark" ||
            (!storedTheme &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        document.documentElement.classList.toggle("dark", nextDark);
        setDark(nextDark);
    }, []);

    const toggleTheme = () => {
        const nextDark = !dark;
        setDark(nextDark);
        document.documentElement.classList.toggle("dark", nextDark);
        window.localStorage.setItem(storageKey, nextDark ? "dark" : "light");
    };

    return (
        <Button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            size="icon"
            type="button"
            variant="ghost"
        >
            {dark ? (
                <SunIcon aria-hidden="true" />
            ) : (
                <MoonIcon aria-hidden="true" />
            )}
        </Button>
    );
}
