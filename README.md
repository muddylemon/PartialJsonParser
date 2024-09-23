# ts-partial-json-parser

A TypeScript partial JSON parser with configurable options.

## Installation

```bash
npm install ts-partial-json-parser
```

## Usage

```typescript
import { PartialJsonParser } from 'ts-partial-json-parser';

const parser = new PartialJsonParser({
  allowInfNan: true,
  partialMode: 'on',
  floatMode: 'lossless'
});

const result = parser.parse('{"key": 123.456, "partial": "value",');
console.log(result);
```

## API

[Add API documentation here]

## License

MIT
