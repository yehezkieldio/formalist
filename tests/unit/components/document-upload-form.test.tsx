import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DocumentUploadForm } from "#/components/admin/document-upload-form";

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}));

describe("document upload form", () => {
    it("stores original files by default without native API form navigation", () => {
        const markup = renderToStaticMarkup(<DocumentUploadForm />);

        expect(markup).not.toContain('action="/api/upload"');
        expect(markup).toContain('name="storeOriginalFile"');
        expect(markup).toContain('value="true"');
        expect(markup).toContain('aria-label="Store original file"');
        expect(markup).toContain('checked=""');
        expect(markup).toContain('disabled=""');
    });
});
