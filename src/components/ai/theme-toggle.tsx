"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "#/components/ui/button";

const storageKey = "formalist-theme";

export function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        const nextDark = !dark;
        setDark(nextDark);
        document.documentElement.classList.toggle("dark", nextDark);
        document.documentElement.style.colorScheme = nextDark
            ? "dark"
            : "light";
        window.localStorage.setItem(storageKey, nextDark ? "dark" : "light");
    };

    return (
        <Button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            size="icon"
            type="button"
            variant="ghost"
            className="h-8 w-8 active:scale-95 transition-transform text-muted-foreground/80 hover:text-foreground"
        >
            {dark ? (
                <SunIcon className="size-4" aria-hidden="true" />
            ) : (
                <MoonIcon className="size-4" aria-hidden="true" />
            )}
        </Button>
    );
}
