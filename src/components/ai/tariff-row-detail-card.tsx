import { DetailRows } from "#/components/ai/source-detail-rows";

export function TariffRowDetailCard({
    source,
}: {
    source: Record<string, unknown>;
}) {
    return (
        <DetailRows
            rows={[
                ["Airline", source.airline],
                ["Destination", source.destinationCity],
                ["Airport code", source.destinationCode],
                ["Route type", source.routeType],
                ["Transit route", source.transitRoute],
                ["Flight", source.flightNumber],
                ["Schedule", source.schedule],
                ["SMU price/kg", source.smuPricePerKg],
                ["Promo", source.isPromo],
                ["Raw row", source.rawRowText ?? source.sourceText],
            ]}
            title="Tariff row"
        />
    );
}
