import { describe, expect, it, vi } from "vitest";

const structuredMock = {
    searchTariffs: vi.fn(() =>
        Promise.resolve([
            {
                airline: "Pelita Air",
                destinationCity: "Surabaya",
                destinationCode: "SUB",
                isPromo: false,
                originCity: "Balikpapan",
                routeType: "DIRECT",
            },
            {
                airline: "Lion Air",
                destinationCity: "Surabaya",
                destinationCode: "SUB",
                isPromo: true,
                originCity: "Balikpapan",
                routeType: "TRANSIT",
            },
        ])
    ),
};

vi.mock("#/server/retrieval/structured-search", () => structuredMock);

describe("destination listing", () => {
    it("groups extracted destinations", async () => {
        const { listDestinations } =
            await import("#/server/retrieval/destination-list");

        await expect(listDestinations()).resolves.toEqual([
            expect.objectContaining({
                airlines: ["Pelita Air", "Lion Air"],
                city: "Surabaya",
                code: "SUB",
                promo: true,
                sourceCount: 2,
            }),
        ]);
    });
});
