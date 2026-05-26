import { parseDocxDocument } from "./docx";
import { parsePdfDocument } from "./pdf";
import { parseTxtDocument } from "./txt";
import type {
    ParserInput,
    ParserResult,
    SupportedParseFileType,
} from "./types";
import { ParserError, supportedParseFileTypes } from "./types";

export function isSupportedParseFileType(
    fileType: string
): fileType is SupportedParseFileType {
    return supportedParseFileTypes.includes(
        fileType.toLowerCase() as SupportedParseFileType
    );
}

export function parseDocument(input: ParserInput): Promise<ParserResult> {
    const fileType = input.fileType.toLowerCase();

    if (!isSupportedParseFileType(fileType)) {
        return Promise.reject(
            new ParserError(
                "unsupported-file-type",
                `Unsupported document file type: ${input.fileType}`
            )
        );
    }

    if (fileType === "txt") {
        return Promise.resolve(parseTxtDocument(input));
    }

    if (fileType === "docx") {
        return parseDocxDocument(input);
    }

    if (fileType === "pdf") {
        return parsePdfDocument(input);
    }

    return Promise.reject(
        new ParserError(
            "unsupported-file-type",
            `Unsupported document file type: ${input.fileType}`
        )
    );
}
