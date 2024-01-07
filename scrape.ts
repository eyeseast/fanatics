#!/usr/bin/env deno
import { CsvParseStream } from "https://deno.land/std@0.195.0/csv/csv_parse_stream.ts";
import { stringify } from "https://deno.land/std@0.195.0/csv/mod.ts";
import * as cheerio from "https://esm.sh/cheerio@0.22.0";

async function main() {
  const source = await Deno.open("urls.csv");
  const sink = await Deno.open("prices.csv", { create: true, write: true });

  const rows = await source.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new CsvParseStream({
        skipFirstRow: true,
        columns: ["name", "url", "selector"],
      })
    );

  const output = [];
  for await (const { name, url, selector } of rows) {
    const html = await fetch(url).then((r) => r.text());
    const $ = cheerio.load(html);
    const price = $(selector).text().trim();
    const row = { name, url, price };

    output.push(row);
  }

  const encoder = new TextEncoder();
  sink.write(
    encoder.encode(
      stringify(output, { columns: ["name", "url", "price"] }).trim()
    )
  );
}

main().catch(console.error);
