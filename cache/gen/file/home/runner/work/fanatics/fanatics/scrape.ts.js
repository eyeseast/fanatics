#!/usr/bin/env deno
import { CsvParseStream } from "https://deno.land/std@0.195.0/csv/csv_parse_stream.ts";
import { stringify } from "https://deno.land/std@0.195.0/csv/mod.ts";
import * as cheerio from "https://esm.sh/cheerio@0.22.0";
async function main() {
    const source = await Deno.open("urls.csv");
    const sink = await Deno.open("prices.csv", {
        create: true,
        write: true
    });
    const rows = await source.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new CsvParseStream({
        skipFirstRow: true,
        columns: [
            "url",
            "selector"
        ]
    }));
    const output = [];
    for await (const { url , selector  } of rows){
        const html = await fetch(url).then((r)=>r.text());
        const $ = cheerio.load(html);
        const price = $(selector).text().trim();
        const row = {
            url,
            price
        };
        output.push(row);
    }
    const encoder = new TextEncoder();
    sink.write(encoder.encode(stringify(output, {
        columns: [
            "url",
            "price"
        ]
    }).trim()));
}
main().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9mYW5hdGljcy9mYW5hdGljcy9zY3JhcGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgZGVub1xuaW1wb3J0IHsgQ3N2UGFyc2VTdHJlYW0gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTk1LjAvY3N2L2Nzdl9wYXJzZV9zdHJlYW0udHNcIjtcbmltcG9ydCB7IHN0cmluZ2lmeSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xOTUuMC9jc3YvbW9kLnRzXCI7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gXCJodHRwczovL2VzbS5zaC9jaGVlcmlvQDAuMjIuMFwiO1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBzb3VyY2UgPSBhd2FpdCBEZW5vLm9wZW4oXCJ1cmxzLmNzdlwiKTtcbiAgY29uc3Qgc2luayA9IGF3YWl0IERlbm8ub3BlbihcInByaWNlcy5jc3ZcIiwgeyBjcmVhdGU6IHRydWUsIHdyaXRlOiB0cnVlIH0pO1xuXG4gIGNvbnN0IHJvd3MgPSBhd2FpdCBzb3VyY2UucmVhZGFibGVcbiAgICAucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKCkpXG4gICAgLnBpcGVUaHJvdWdoKFxuICAgICAgbmV3IENzdlBhcnNlU3RyZWFtKHtcbiAgICAgICAgc2tpcEZpcnN0Um93OiB0cnVlLFxuICAgICAgICBjb2x1bW5zOiBbXCJ1cmxcIiwgXCJzZWxlY3RvclwiXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICBjb25zdCBvdXRwdXQgPSBbXTtcbiAgZm9yIGF3YWl0IChjb25zdCB7IHVybCwgc2VsZWN0b3IgfSBvZiByb3dzKSB7XG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoKHVybCkudGhlbigocikgPT4gci50ZXh0KCkpO1xuICAgIGNvbnN0ICQgPSBjaGVlcmlvLmxvYWQoaHRtbCk7XG4gICAgY29uc3QgcHJpY2UgPSAkKHNlbGVjdG9yKS50ZXh0KCkudHJpbSgpO1xuICAgIGNvbnN0IHJvdyA9IHsgdXJsLCBwcmljZSB9O1xuXG4gICAgb3V0cHV0LnB1c2gocm93KTtcbiAgfVxuXG4gIGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgc2luay53cml0ZShcbiAgICBlbmNvZGVyLmVuY29kZShzdHJpbmdpZnkob3V0cHV0LCB7IGNvbHVtbnM6IFtcInVybFwiLCBcInByaWNlXCJdIH0pLnRyaW0oKSlcbiAgKTtcbn1cblxubWFpbigpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxTQUFTLGNBQWMsUUFBUSx3REFBd0Q7QUFDdkYsU0FBUyxTQUFTLFFBQVEsMkNBQTJDO0FBQ3JFLFlBQVksYUFBYSxnQ0FBZ0M7QUFFekQsZUFBZTtJQUNiLE1BQU0sU0FBUyxNQUFNLEtBQUssS0FBSztJQUMvQixNQUFNLE9BQU8sTUFBTSxLQUFLLEtBQUssY0FBYztRQUFFLFFBQVE7UUFBTSxPQUFPO0lBQUs7SUFFdkUsTUFBTSxPQUFPLE1BQU0sT0FBTyxTQUN2QixZQUFZLElBQUkscUJBQ2hCLFlBQ0MsSUFBSSxlQUFlO1FBQ2pCLGNBQWM7UUFDZCxTQUFTO1lBQUM7WUFBTztTQUFXO0lBQzlCO0lBR0osTUFBTSxTQUFTLEVBQUU7SUFDakIsV0FBVyxNQUFNLEVBQUUsSUFBRyxFQUFFLFNBQVEsRUFBRSxJQUFJLEtBQU07UUFDMUMsTUFBTSxPQUFPLE1BQU0sTUFBTSxLQUFLLEtBQUssQ0FBQyxJQUFNLEVBQUU7UUFDNUMsTUFBTSxJQUFJLFFBQVEsS0FBSztRQUN2QixNQUFNLFFBQVEsRUFBRSxVQUFVLE9BQU87UUFDakMsTUFBTSxNQUFNO1lBQUU7WUFBSztRQUFNO1FBRXpCLE9BQU8sS0FBSztJQUNkO0lBRUEsTUFBTSxVQUFVLElBQUk7SUFDcEIsS0FBSyxNQUNILFFBQVEsT0FBTyxVQUFVLFFBQVE7UUFBRSxTQUFTO1lBQUM7WUFBTztTQUFRO0lBQUMsR0FBRztBQUVwRTtBQUVBLE9BQU8sTUFBTSxRQUFRIn0=