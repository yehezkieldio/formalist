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
        alias: "denpasar",
        canonicalValue: "DENPASAR",
        metadata: { airportCodes: ["DPS"] },
        type: "city",
    },
    {
        alias: "bali",
        canonicalValue: "DENPASAR",
        metadata: { airportCodes: ["DPS"] },
        type: "city",
    },
    {
        alias: "dps",
        canonicalValue: "DPS",
        metadata: { city: "DENPASAR" },
        type: "airport",
    },
    {
        alias: "jakarta",
        canonicalValue: "JAKARTA",
        metadata: { airportCodes: ["CGK", "HLP"] },
        type: "city",
    },
    {
        alias: "cgk",
        canonicalValue: "CGK",
        metadata: { city: "JAKARTA" },
        type: "airport",
    },
    {
        alias: "hlp",
        canonicalValue: "HLP",
        metadata: { city: "JAKARTA" },
        type: "airport",
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
    {
        alias: "garuda",
        canonicalValue: "Garuda / Citilink",
        type: "airline",
    },
    {
        alias: "garuda indonesia",
        canonicalValue: "Garuda / Citilink",
        type: "airline",
    },
    {
        alias: "citilink",
        canonicalValue: "Garuda / Citilink",
        type: "airline",
    },
] satisfies AliasInput[];
