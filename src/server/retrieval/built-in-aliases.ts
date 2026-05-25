import type { AliasInput } from "#/server/db/queries/aliases";

export const builtInAliases = [
    {
        alias: "jogja",
        canonicalValue: "Yogyakarta",
        isAmbiguous: true,
        metadata: { candidates: ["JOG", "YIA"] },
        type: "city",
    },
    {
        alias: "yogyakarta",
        canonicalValue: "Yogyakarta",
        isAmbiguous: true,
        metadata: { candidates: ["JOG", "YIA"] },
        type: "city",
    },
    {
        alias: "jog",
        canonicalValue: "JOG",
        isAmbiguous: true,
        metadata: { city: "Yogyakarta" },
        type: "airport",
    },
    {
        alias: "yia",
        canonicalValue: "YIA",
        isAmbiguous: true,
        metadata: { city: "Yogyakarta" },
        type: "airport",
    },
    {
        alias: "surabaya",
        canonicalValue: "Surabaya",
        type: "city",
    },
    {
        alias: "sub",
        canonicalValue: "SUB",
        type: "airport",
    },
    {
        alias: "makassar",
        canonicalValue: "Makassar",
        type: "city",
    },
    {
        alias: "upg",
        canonicalValue: "UPG",
        type: "airport",
    },
    {
        alias: "pelita",
        canonicalValue: "Pelita Air",
        type: "airline",
    },
    {
        alias: "lion",
        canonicalValue: "Lion Air",
        type: "airline",
    },
] satisfies AliasInput[];
