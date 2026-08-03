import { describe, expect, it } from "vitest";
import { extractJson, parseImagePayload } from "./gemini";

describe("extractJson", () => {
    it("passes plain JSON through", () => {
        expect(extractJson('{"a":1}')).toBe('{"a":1}');
    });

    it("unwraps a markdown fence", () => {
        expect(extractJson('```json\n{"a":1}\n```')).toBe('{"a":1}');
        expect(extractJson('```\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it("drops the sentence the model wrapped around it", () => {
        expect(extractJson('Here you go:\n{"a":1}\nHope that helps!')).toBe('{"a":1}');
    });

    it("handles a top-level array", () => {
        expect(extractJson("Sure: [1, 2]")).toBe("[1, 2]");
    });

    it("keeps nested braces intact", () => {
        const json = '{"a":{"b":[1,{"c":2}]}}';
        expect(JSON.parse(extractJson(`\`\`\`json\n${json}\n\`\`\``))).toEqual({
            a: { b: [1, { c: 2 }] },
        });
    });

    it("returns the input when there is no JSON in it", () => {
        expect(extractJson("NO_RESULTS")).toBe("NO_RESULTS");
    });
});

describe("parseImagePayload", () => {
    it("splits a data URL", () => {
        expect(parseImagePayload("data:image/png;base64,AAAA")).toEqual({
            base64: "AAAA",
            mimeType: "image/png",
        });
    });

    it("assumes JPEG for a bare base64 payload", () => {
        expect(parseImagePayload("AAAA")).toEqual({ base64: "AAAA", mimeType: "image/jpeg" });
    });

    it("rejects a type Gemini cannot read", () => {
        expect(parseImagePayload("data:application/pdf;base64,AAAA")).toBeNull();
        expect(parseImagePayload("data:text/html;base64,AAAA")).toBeNull();
    });

    it("rejects empty input", () => {
        expect(parseImagePayload("")).toBeNull();
        expect(parseImagePayload(null)).toBeNull();
        expect(parseImagePayload("data:image/png;base64,")).toBeNull();
    });
});
