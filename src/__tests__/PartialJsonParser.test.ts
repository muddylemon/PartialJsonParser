import { PartialJsonParser, LosslessFloat } from "../PartialJsonParser";

describe("PartialJsonParser", () => {
  it("should parse valid JSON", () => {
    const parser = new PartialJsonParser();
    const result = parser.parse('{"key": "value"}');
    expect(result).toEqual({ key: "value" });
  });

  it("should handle partial JSON in partial mode", () => {
    const parser = new PartialJsonParser({ partialMode: "on" });
    const result = parser.parse('{"key": "value",');
    expect(result).toEqual({ key: "value" });
  });

  it("should handle lossless float mode", () => {
    const parser = new PartialJsonParser({ floatMode: "lossless" });
    const result = parser.parse('{"number": 123.456}');
    expect(result.number).toBeInstanceOf(LosslessFloat);
    expect(result.number.value).toBe("123.456");
  });

  // Add more tests as needed
});
