// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { convertRowToObject, defaultReadOptions, parseRecord } from "../csv/_io.ts";
import { TextDelimiterStream } from "../streams/text_delimiter_stream.ts";
class StreamLineReader {
    #reader;
    #done = false;
    constructor(reader){
        this.#reader = reader;
    }
    async readLine() {
        const { value , done  } = await this.#reader.read();
        if (done) {
            this.#done = true;
            return null;
        } else {
            // NOTE: Remove trailing CR for compatibility with golang's `encoding/csv`
            return stripLastCR(value);
        }
    }
    isEOF() {
        return this.#done;
    }
    cancel() {
        this.#reader.cancel();
    }
}
function stripLastCR(s) {
    return s.endsWith("\r") ? s.slice(0, -1) : s;
}
/**
 * Read data from a CSV-encoded stream or file.
 * Provides an auto/custom mapper for columns.
 *
 * A `CsvParseStream` expects input conforming to
 * [RFC 4180](https://rfc-editor.org/rfc/rfc4180.html).
 *
 * @example
 * ```ts
 * import { CsvParseStream } from "https://deno.land/std@$STD_VERSION/csv/csv_parse_stream.ts";
 * const res = await fetch("https://example.com/data.csv");
 * const parts = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new CsvParseStream());
 * ```
 */ export class CsvParseStream {
    #readable;
    #options;
    #lineReader;
    #lines;
    #lineIndex = 0;
    #isFirstRow = true;
    #headers = [];
    constructor(options){
        this.#options = {
            ...defaultReadOptions,
            ...options
        };
        this.#lines = new TextDelimiterStream("\n");
        this.#lineReader = new StreamLineReader(this.#lines.readable.getReader());
        this.#readable = new ReadableStream({
            pull: (controller)=>this.#pull(controller),
            cancel: ()=>this.#lineReader.cancel()
        });
    }
    async #pull(controller) {
        const line = await this.#lineReader.readLine();
        if (line === "") {
            // Found an empty line
            this.#lineIndex++;
            return this.#pull(controller);
        }
        if (line === null) {
            // Reached to EOF
            controller.close();
            this.#lineReader.cancel();
            return;
        }
        const record = await parseRecord(line, this.#lineReader, this.#options, this.#lineIndex);
        if (record === null) {
            controller.close();
            this.#lineReader.cancel();
            return;
        }
        if (this.#isFirstRow) {
            this.#isFirstRow = false;
            if (this.#options.skipFirstRow || this.#options.columns) {
                this.#headers = [];
                if (this.#options.skipFirstRow) {
                    const head = record;
                    this.#headers = head;
                }
                if (this.#options.columns) {
                    this.#headers = this.#options.columns;
                }
            }
            if (this.#options.skipFirstRow) {
                return this.#pull(controller);
            }
        }
        this.#lineIndex++;
        if (record.length > 0) {
            if (this.#options.skipFirstRow || this.#options.columns) {
                controller.enqueue(convertRowToObject(record, this.#headers, this.#lineIndex));
            } else {
                controller.enqueue(record);
            }
        } else {
            return this.#pull(controller);
        }
    }
    get readable() {
        return this.#readable;
    }
    get writable() {
        return this.#lines.writable;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL2Nzdi9jc3ZfcGFyc2Vfc3RyZWFtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7XG4gIGNvbnZlcnRSb3dUb09iamVjdCxcbiAgZGVmYXVsdFJlYWRPcHRpb25zLFxuICB0eXBlIExpbmVSZWFkZXIsXG4gIHBhcnNlUmVjb3JkLFxuICB0eXBlIFBhcnNlUmVzdWx0LFxuICB0eXBlIFJlYWRPcHRpb25zLFxufSBmcm9tIFwiLi4vY3N2L19pby50c1wiO1xuaW1wb3J0IHsgVGV4dERlbGltaXRlclN0cmVhbSB9IGZyb20gXCIuLi9zdHJlYW1zL3RleHRfZGVsaW1pdGVyX3N0cmVhbS50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIENzdlBhcnNlU3RyZWFtT3B0aW9ucyBleHRlbmRzIFJlYWRPcHRpb25zIHtcbiAgLyoqXG4gICAqIElmIHlvdSBwcm92aWRlIGBza2lwRmlyc3RSb3c6IHRydWVgIGFuZCBgY29sdW1uc2AsIHRoZSBmaXJzdCBsaW5lIHdpbGwgYmVcbiAgICogc2tpcHBlZC5cbiAgICogSWYgeW91IHByb3ZpZGUgYHNraXBGaXJzdFJvdzogdHJ1ZWAgYnV0IG5vdCBgY29sdW1uc2AsIHRoZSBmaXJzdCBsaW5lIHdpbGxcbiAgICogYmUgc2tpcHBlZCBhbmQgdXNlZCBhcyBoZWFkZXIgZGVmaW5pdGlvbnMuXG4gICAqL1xuICBza2lwRmlyc3RSb3c/OiBib29sZWFuO1xuICAvKiogTGlzdCBvZiBuYW1lcyB1c2VkIGZvciBoZWFkZXIgZGVmaW5pdGlvbi4gKi9cbiAgY29sdW1ucz86IHJlYWRvbmx5IHN0cmluZ1tdO1xufVxuXG5jbGFzcyBTdHJlYW1MaW5lUmVhZGVyIGltcGxlbWVudHMgTGluZVJlYWRlciB7XG4gICNyZWFkZXI6IFJlYWRhYmxlU3RyZWFtRGVmYXVsdFJlYWRlcjxzdHJpbmc+O1xuICAjZG9uZSA9IGZhbHNlO1xuICBjb25zdHJ1Y3RvcihyZWFkZXI6IFJlYWRhYmxlU3RyZWFtRGVmYXVsdFJlYWRlcjxzdHJpbmc+KSB7XG4gICAgdGhpcy4jcmVhZGVyID0gcmVhZGVyO1xuICB9XG5cbiAgYXN5bmMgcmVhZExpbmUoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgY29uc3QgeyB2YWx1ZSwgZG9uZSB9ID0gYXdhaXQgdGhpcy4jcmVhZGVyLnJlYWQoKTtcbiAgICBpZiAoZG9uZSkge1xuICAgICAgdGhpcy4jZG9uZSA9IHRydWU7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTk9URTogUmVtb3ZlIHRyYWlsaW5nIENSIGZvciBjb21wYXRpYmlsaXR5IHdpdGggZ29sYW5nJ3MgYGVuY29kaW5nL2NzdmBcbiAgICAgIHJldHVybiBzdHJpcExhc3RDUih2YWx1ZSEpO1xuICAgIH1cbiAgfVxuXG4gIGlzRU9GKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNkb25lO1xuICB9XG5cbiAgY2FuY2VsKCkge1xuICAgIHRoaXMuI3JlYWRlci5jYW5jZWwoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdHJpcExhc3RDUihzOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcy5lbmRzV2l0aChcIlxcclwiKSA/IHMuc2xpY2UoMCwgLTEpIDogcztcbn1cblxudHlwZSBSb3dUeXBlPFQ+ID0gVCBleHRlbmRzIHVuZGVmaW5lZCA/IHN0cmluZ1tdXG4gIDogUGFyc2VSZXN1bHQ8Q3N2UGFyc2VTdHJlYW1PcHRpb25zLCBUPltudW1iZXJdO1xuXG4vKipcbiAqIFJlYWQgZGF0YSBmcm9tIGEgQ1NWLWVuY29kZWQgc3RyZWFtIG9yIGZpbGUuXG4gKiBQcm92aWRlcyBhbiBhdXRvL2N1c3RvbSBtYXBwZXIgZm9yIGNvbHVtbnMuXG4gKlxuICogQSBgQ3N2UGFyc2VTdHJlYW1gIGV4cGVjdHMgaW5wdXQgY29uZm9ybWluZyB0b1xuICogW1JGQyA0MTgwXShodHRwczovL3JmYy1lZGl0b3Iub3JnL3JmYy9yZmM0MTgwLmh0bWwpLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQ3N2UGFyc2VTdHJlYW0gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jc3YvY3N2X3BhcnNlX3N0cmVhbS50c1wiO1xuICogY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2V4YW1wbGUuY29tL2RhdGEuY3N2XCIpO1xuICogY29uc3QgcGFydHMgPSByZXMuYm9keSFcbiAqICAgLnBpcGVUaHJvdWdoKG5ldyBUZXh0RGVjb2RlclN0cmVhbSgpKVxuICogICAucGlwZVRocm91Z2gobmV3IENzdlBhcnNlU3RyZWFtKCkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBDc3ZQYXJzZVN0cmVhbTxcbiAgY29uc3QgVCBleHRlbmRzIENzdlBhcnNlU3RyZWFtT3B0aW9ucyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbj4gaW1wbGVtZW50cyBUcmFuc2Zvcm1TdHJlYW08c3RyaW5nLCBSb3dUeXBlPFQ+PiB7XG4gIHJlYWRvbmx5ICNyZWFkYWJsZTogUmVhZGFibGVTdHJlYW08XG4gICAgc3RyaW5nW10gfCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCB1bmtub3duPlxuICA+O1xuICByZWFkb25seSAjb3B0aW9uczogQ3N2UGFyc2VTdHJlYW1PcHRpb25zO1xuICByZWFkb25seSAjbGluZVJlYWRlcjogU3RyZWFtTGluZVJlYWRlcjtcbiAgcmVhZG9ubHkgI2xpbmVzOiBUZXh0RGVsaW1pdGVyU3RyZWFtO1xuICAjbGluZUluZGV4ID0gMDtcbiAgI2lzRmlyc3RSb3cgPSB0cnVlO1xuXG4gICNoZWFkZXJzOiByZWFkb25seSBzdHJpbmdbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBUKSB7XG4gICAgdGhpcy4jb3B0aW9ucyA9IHtcbiAgICAgIC4uLmRlZmF1bHRSZWFkT3B0aW9ucyxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcblxuICAgIHRoaXMuI2xpbmVzID0gbmV3IFRleHREZWxpbWl0ZXJTdHJlYW0oXCJcXG5cIik7XG4gICAgdGhpcy4jbGluZVJlYWRlciA9IG5ldyBTdHJlYW1MaW5lUmVhZGVyKHRoaXMuI2xpbmVzLnJlYWRhYmxlLmdldFJlYWRlcigpKTtcbiAgICB0aGlzLiNyZWFkYWJsZSA9IG5ldyBSZWFkYWJsZVN0cmVhbSh7XG4gICAgICBwdWxsOiAoY29udHJvbGxlcikgPT4gdGhpcy4jcHVsbChjb250cm9sbGVyKSxcbiAgICAgIGNhbmNlbDogKCkgPT4gdGhpcy4jbGluZVJlYWRlci5jYW5jZWwoKSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jICNwdWxsKFxuICAgIGNvbnRyb2xsZXI6IFJlYWRhYmxlU3RyZWFtRGVmYXVsdENvbnRyb2xsZXI8XG4gICAgICBzdHJpbmdbXSB8IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVua25vd24+XG4gICAgPixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGluZSA9IGF3YWl0IHRoaXMuI2xpbmVSZWFkZXIucmVhZExpbmUoKTtcbiAgICBpZiAobGluZSA9PT0gXCJcIikge1xuICAgICAgLy8gRm91bmQgYW4gZW1wdHkgbGluZVxuICAgICAgdGhpcy4jbGluZUluZGV4Kys7XG4gICAgICByZXR1cm4gdGhpcy4jcHVsbChjb250cm9sbGVyKTtcbiAgICB9XG4gICAgaWYgKGxpbmUgPT09IG51bGwpIHtcbiAgICAgIC8vIFJlYWNoZWQgdG8gRU9GXG4gICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICB0aGlzLiNsaW5lUmVhZGVyLmNhbmNlbCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY29yZCA9IGF3YWl0IHBhcnNlUmVjb3JkKFxuICAgICAgbGluZSxcbiAgICAgIHRoaXMuI2xpbmVSZWFkZXIsXG4gICAgICB0aGlzLiNvcHRpb25zLFxuICAgICAgdGhpcy4jbGluZUluZGV4LFxuICAgICk7XG4gICAgaWYgKHJlY29yZCA9PT0gbnVsbCkge1xuICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgdGhpcy4jbGluZVJlYWRlci5jYW5jZWwoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy4jaXNGaXJzdFJvdykge1xuICAgICAgdGhpcy4jaXNGaXJzdFJvdyA9IGZhbHNlO1xuICAgICAgaWYgKHRoaXMuI29wdGlvbnMuc2tpcEZpcnN0Um93IHx8IHRoaXMuI29wdGlvbnMuY29sdW1ucykge1xuICAgICAgICB0aGlzLiNoZWFkZXJzID0gW107XG5cbiAgICAgICAgaWYgKHRoaXMuI29wdGlvbnMuc2tpcEZpcnN0Um93KSB7XG4gICAgICAgICAgY29uc3QgaGVhZCA9IHJlY29yZDtcbiAgICAgICAgICB0aGlzLiNoZWFkZXJzID0gaGVhZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLiNvcHRpb25zLmNvbHVtbnMpIHtcbiAgICAgICAgICB0aGlzLiNoZWFkZXJzID0gdGhpcy4jb3B0aW9ucy5jb2x1bW5zO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLiNvcHRpb25zLnNraXBGaXJzdFJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy4jcHVsbChjb250cm9sbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLiNsaW5lSW5kZXgrKztcbiAgICBpZiAocmVjb3JkLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICh0aGlzLiNvcHRpb25zLnNraXBGaXJzdFJvdyB8fCB0aGlzLiNvcHRpb25zLmNvbHVtbnMpIHtcbiAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGNvbnZlcnRSb3dUb09iamVjdChcbiAgICAgICAgICByZWNvcmQsXG4gICAgICAgICAgdGhpcy4jaGVhZGVycyxcbiAgICAgICAgICB0aGlzLiNsaW5lSW5kZXgsXG4gICAgICAgICkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKHJlY29yZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLiNwdWxsKGNvbnRyb2xsZXIpO1xuICAgIH1cbiAgfVxuXG4gIGdldCByZWFkYWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jcmVhZGFibGUgYXMgUmVhZGFibGVTdHJlYW08Um93VHlwZTxUPj47XG4gIH1cblxuICBnZXQgd3JpdGFibGUoKTogV3JpdGFibGVTdHJlYW08c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuI2xpbmVzLndyaXRhYmxlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUNFLGtCQUFrQixFQUNsQixrQkFBa0IsRUFFbEIsV0FBVyxRQUdOLGdCQUFnQjtBQUN2QixTQUFTLG1CQUFtQixRQUFRLHNDQUFzQztBQWMxRSxNQUFNO0lBQ0osQ0FBQyxNQUFNLENBQXNDO0lBQzdDLENBQUMsSUFBSSxHQUFHLE1BQU07SUFDZCxZQUFZLE1BQTJDLENBQUU7UUFDdkQsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHO0lBQ2pCO0lBRUEsTUFBTSxXQUFtQztRQUN2QyxNQUFNLEVBQUUsTUFBSyxFQUFFLEtBQUksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzNDLElBQUksTUFBTTtZQUNSLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRztZQUNiLE9BQU87UUFDVCxPQUFPO1lBQ0wsMEVBQTBFO1lBQzFFLE9BQU8sWUFBWTtRQUNyQjtJQUNGO0lBRUEsUUFBaUI7UUFDZixPQUFPLElBQUksQ0FBQyxDQUFDLElBQUk7SUFDbkI7SUFFQSxTQUFTO1FBQ1AsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2Y7QUFDRjtBQUVBLFNBQVMsWUFBWSxD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