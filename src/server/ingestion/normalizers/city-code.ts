import { distance } from "fastest-levenshtein";
import Fuse from "fuse.js";

export interface LocationCandidate {
    aliases: string[];
    city: string;
    code: string;
}

export interface NormalizedLocation {
    candidate: LocationCandidate | null;
    issues: string[];
    matchedAlias: string | null;
}

export const locationCandidates: LocationCandidate[] = [
    { aliases: ["surabaya", "sub"], city: "Surabaya", code: "SUB" },
    {
        aliases: ["makassar", "ujung pandang", "upg"],
        city: "Makassar",
        code: "UPG",
    },
    {
        aliases: ["yogyakarta", "jogja", "jog"],
        city: "Yogyakarta",
        code: "JOG",
    },
    {
        aliases: ["yogyakarta", "jogja", "yia", "kulon progo"],
        city: "Yogyakarta",
        code: "YIA",
    },
    { aliases: ["balikpapan", "bpn"], city: "Balikpapan", code: "BPN" },
];

const fuse = new Fuse(locationCandidates, {
    includeScore: true,
    keys: ["city", "code", "aliases"],
    threshold: 0.32,
});

function normalizeToken(value: string | null | undefined) {
    return value?.trim().toLowerCase() ?? "";
}

export function normalizeCityCode(input: {
    city?: string | null;
    code?: string | null;
}): NormalizedLocation {
    const city = normalizeToken(input.city);
    const code = normalizeToken(input.code).toUpperCase();
    const query = [city, code].filter(Boolean).join(" ");

    if (!query) {
        return {
            candidate: null,
            issues: ["missing_destination"],
            matchedAlias: null,
        };
    }

    const codeMatches = code
        ? locationCandidates.filter((candidate) => candidate.code === code)
        : [];
    const cityMatches = city
        ? locationCandidates.filter((candidate) =>
              candidate.aliases.includes(city)
          )
        : [];
    const matches = [...new Set([...codeMatches, ...cityMatches])];

    if (cityMatches.length === 1 && codeMatches.length === 1) {
        const [cityMatch] = cityMatches;
        const [codeMatch] = codeMatches;

        if (cityMatch.code !== codeMatch.code) {
            return {
                candidate: codeMatch,
                issues: ["city_code_mismatch"],
                matchedAlias: query,
            };
        }
    }

    if (matches.length > 1) {
        return {
            candidate: null,
            issues: ["ambiguous_destination_alias"],
            matchedAlias: query,
        };
    }

    if (matches.length === 1) {
        const [match] = matches;
        const issues =
            code && match.code !== code ? ["city_code_mismatch"] : [];

        return {
            candidate: match,
            issues,
            matchedAlias: query,
        };
    }

    const [best] = fuse.search(query);

    if (!best || (best.score ?? 1) > 0.32) {
        return {
            candidate: null,
            issues: ["unknown_destination"],
            matchedAlias: query,
        };
    }

    let closestAlias = best.item.aliases[0] ?? best.item.city;

    for (const alias of best.item.aliases) {
        if (distance(query, alias) < distance(query, closestAlias)) {
            closestAlias = alias;
        }
    }

    return {
        candidate: best.item,
        issues: [],
        matchedAlias: closestAlias,
    };
}
