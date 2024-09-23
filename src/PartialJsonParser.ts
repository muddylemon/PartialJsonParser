type StringCacheMode = "all" | "none" | "small";
type PartialMode = "off" | "on";
type FloatMode = "number" | "string" | "lossless";

interface ParserOptions {
  allowInfNan?: boolean;
  cacheMode?: StringCacheMode;
  partialMode?: PartialMode;
  catchDuplicateKeys?: boolean;
  floatMode?: FloatMode;
}

class LosslessFloat {
  constructor(public value: string) {}

  toNumber(): number {
    return parseFloat(this.value);
  }

  toString(): string {
    return this.value;
  }
}

class PartialJsonParser {
  private options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      allowInfNan: options.allowInfNan ?? true,
      cacheMode: options.cacheMode ?? "all",
      partialMode: options.partialMode ?? "off",
      catchDuplicateKeys: options.catchDuplicateKeys ?? false,
      floatMode: options.floatMode ?? "number",
    };
  }

  parse(jsonData: string): any {
    const trimmed = jsonData.trim();
    if (trimmed === "") {
      throw new Error("Empty JSON string");
    }

    try {
      let result = JSON.parse(trimmed, (key, value) => {
        if (typeof value === "number") {
          if (!this.options.allowInfNan && !isFinite(value)) {
            throw new Error("Inf/NaN not allowed");
          }
          if (this.options.floatMode === "string") {
            return value.toString();
          }
          if (this.options.floatMode === "lossless") {
            return new LosslessFloat(value.toString());
          }
        }
        return value;
      });

      if (this.options.partialMode === "on") {
        // In partial mode, we allow incomplete objects/arrays
        if (typeof result === "object" && result !== null) {
          result = this.handlePartialObject(result);
        }
      }

      return result;
    } catch (error) {
      if (this.options.partialMode === "on") {
        // In partial mode, try to salvage what we can
        return this.parsePartial(trimmed);
      }
      throw error;
    }
  }

  private handlePartialObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        typeof item === "object" && item !== null
          ? this.handlePartialObject(item)
          : item
      );
    }

    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        obj[key] = this.handlePartialObject(obj[key]);
      }
    }

    return obj;
  }

  private parsePartial(jsonData: string): any {
    let result: any = {};
    let currentKey: string | null = null;
    let currentValue: string = "";
    let inString: boolean = false;
    let escaped: boolean = false;

    for (let i = 0; i < jsonData.length; i++) {
      const char = jsonData[i];

      if (!inString) {
        if (char === '"') {
          inString = true;
        } else if (char === ":") {
          currentKey = currentValue.trim();
          currentValue = "";
        } else if (char === "," || char === "}") {
          if (currentKey !== null) {
            result[currentKey] = this.parseValue(currentValue.trim());
            currentKey = null;
          }
          currentValue = "";
        } else {
          currentValue += char;
        }
      } else {
        if (char === '"' && !escaped) {
          inString = false;
        } else if (char === "\\") {
          escaped = true;
        } else {
          escaped = false;
        }
        currentValue += char;
      }
    }

    // Handle last key-value pair if exists
    if (currentKey !== null) {
      result[currentKey] = this.parseValue(currentValue.trim());
    }

    return result;
  }

  private parseValue(value: string): any {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    if (!isNaN(Number(value))) {
      const num = Number(value);
      if (this.options.floatMode === "string") {
        return value;
      }
      if (this.options.floatMode === "lossless") {
        return new LosslessFloat(value);
      }
      return num;
    }
    return value; // For partial or invalid values
  }
}

export { PartialJsonParser, LosslessFloat };
