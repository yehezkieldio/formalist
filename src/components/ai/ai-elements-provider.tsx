"use client";

import type { ReactNode } from "react";

export interface AiElementsProviderProps {
    children: ReactNode;
}

export function AiElementsProvider({ children }: AiElementsProviderProps) {
    return children;
}
