#!/usr/bin/env deno
import { CsvParseStream } from "https://deno.land/std@0.195.0/csv/csv_parse_stream.ts";

const prices = "prices.csv";
const readme = "README.md";

const heading = `# fanatics

Current prices:

`;

async function main() {
  const source = await Deno.open(prices);
  const sink = await Deno.open(readme, { create: true, write: true });

  const rows = await source.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new CsvParseStream({
        skipFirstRow: true,
        columns: ["name", "url", "price"],
      })
    );

  let output = heading;
  for await (const { name, url, price } of rows) {
    output += `- [${name}](${url}): ${price}\n`;
  }

  const encoder = new TextEncoder();

  sink.write(encoder.encode(output));
}

main().catch(console.error);
