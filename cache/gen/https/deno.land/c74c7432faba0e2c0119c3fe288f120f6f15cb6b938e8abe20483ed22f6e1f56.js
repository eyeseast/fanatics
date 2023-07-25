// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { BytesList } from "../bytes/bytes_list.ts";
import { createLPS } from "./_common.ts";
/**
 * Divide a stream into chunks delimited by a given byte sequence.
 *
 * @example
 * Divide a CSV stream by commas, discarding the commas:
 * ```ts
 * import { DelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter_stream.ts";
 * const res = await fetch("https://example.com/data.csv");
 * const parts = res.body!
 *   .pipeThrough(new DelimiterStream(new TextEncoder().encode(",")))
 *   .pipeThrough(new TextDecoderStream());
 * ```
 *
 * @example
 * Divide a stream after semi-colons, keeping the semi-colons in the output:
 * ```ts
 * import { DelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter_stream.ts";
 * const res = await fetch("https://example.com/file.js");
 * const parts = res.body!
 *   .pipeThrough(
 *     new DelimiterStream(
 *       new TextEncoder().encode(";"),
 *       { disposition: "suffix" },
 *     )
 *   )
 *   .pipeThrough(new TextDecoderStream());
 * ```
 *
 * @param delimiter Delimiter byte sequence
 * @param options Options for the transform stream
 * @returns Transform stream
 */ export class DelimiterStream extends TransformStream {
    #bufs = new BytesList();
    #delimiter;
    #inspectIndex = 0;
    #matchIndex = 0;
    #delimLen;
    #delimLPS;
    #disp;
    constructor(delimiter, options){
        super({
            transform: (chunk, controller)=>{
                this.#handle(chunk, controller);
            },
            flush: (controller)=>{
                controller.enqueue(this.#bufs.concat());
            }
        });
        this.#delimiter = delimiter;
        this.#delimLen = delimiter.length;
        this.#delimLPS = createLPS(delimiter);
        this.#disp = options?.disposition ?? "discard";
    }
    #handle(chunk, controller) {
        this.#bufs.add(chunk);
        let localIndex = 0;
        while(this.#inspectIndex < this.#bufs.size()){
            if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
                this.#inspectIndex++;
                localIndex++;
                this.#matchIndex++;
                if (this.#matchIndex === this.#delimLen) {
                    // Full match
                    const start = this.#inspectIndex - this.#delimLen;
                    const end = this.#disp == "suffix" ? this.#inspectIndex : start;
                    const copy = this.#bufs.slice(0, end);
                    controller.enqueue(copy);
                    const shift = this.#disp == "prefix" ? start : this.#inspectIndex;
                    this.#bufs.shift(shift);
                    this.#inspectIndex = this.#disp == "prefix" ? this.#delimLen : 0;
                    this.#matchIndex = 0;
                }
            } else {
                if (this.#matchIndex === 0) {
                    this.#inspectIndex++;
                    localIndex++;
                } else {
                    this.#matchIndex = this.#delimLPS[this.#matchIndex - 1];
                }
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL3N0cmVhbXMvZGVsaW1pdGVyX3N0cmVhbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBCeXRlc0xpc3QgfSBmcm9tIFwiLi4vYnl0ZXMvYnl0ZXNfbGlzdC50c1wiO1xuaW1wb3J0IHsgY3JlYXRlTFBTIH0gZnJvbSBcIi4vX2NvbW1vbi50c1wiO1xuXG4vKiogRGlzcG9zaXRpb24gb2YgdGhlIGRlbGltaXRlci4gKi9cbmV4cG9ydCB0eXBlIERlbGltaXRlckRpc3Bvc2l0aW9uID1cbiAgLyoqIEluY2x1ZGUgZGVsaW1pdGVyIGluIHRoZSBmb3VuZCBjaHVuay4gKi9cbiAgfCBcInN1ZmZpeFwiXG4gIC8qKiBJbmNsdWRlIGRlbGltaXRlciBpbiB0aGUgc3Vic2VxdWVudCBjaHVuay4gKi9cbiAgfCBcInByZWZpeFwiXG4gIC8qKiBEaXNjYXJkIHRoZSBkZWxpbWl0ZXIuICovXG4gIHwgXCJkaXNjYXJkXCIgLy8gZGVsaW1pdGVyIGRpc2NhcmRlZFxuO1xuXG5leHBvcnQgaW50ZXJmYWNlIERlbGltaXRlclN0cmVhbU9wdGlvbnMge1xuICAvKiogRGlzcG9zaXRpb24gb2YgdGhlIGRlbGltaXRlci4gKi9cbiAgZGlzcG9zaXRpb24/OiBEZWxpbWl0ZXJEaXNwb3NpdGlvbjtcbn1cblxuLyoqXG4gKiBEaXZpZGUgYSBzdHJlYW0gaW50byBjaHVua3MgZGVsaW1pdGVkIGJ5IGEgZ2l2ZW4gYnl0ZSBzZXF1ZW5jZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogRGl2aWRlIGEgQ1NWIHN0cmVhbSBieSBjb21tYXMsIGRpc2NhcmRpbmcgdGhlIGNvbW1hczpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBEZWxpbWl0ZXJTdHJlYW0gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9zdHJlYW1zL2RlbGltaXRlcl9zdHJlYW0udHNcIjtcbiAqIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9kYXRhLmNzdlwiKTtcbiAqIGNvbnN0IHBhcnRzID0gcmVzLmJvZHkhXG4gKiAgIC5waXBlVGhyb3VnaChuZXcgRGVsaW1pdGVyU3RyZWFtKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIixcIikpKVxuICogICAucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKCkpO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIERpdmlkZSBhIHN0cmVhbSBhZnRlciBzZW1pLWNvbG9ucywga2VlcGluZyB0aGUgc2VtaS1jb2xvbnMgaW4gdGhlIG91dHB1dDpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBEZWxpbWl0ZXJTdHJlYW0gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9zdHJlYW1zL2RlbGltaXRlcl9zdHJlYW0udHNcIjtcbiAqIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9maWxlLmpzXCIpO1xuICogY29uc3QgcGFydHMgPSByZXMuYm9keSFcbiAqICAgLnBpcGVUaHJvdWdoKFxuICogICAgIG5ldyBEZWxpbWl0ZXJTdHJlYW0oXG4gKiAgICAgICBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCI7XCIpLFxuICogICAgICAgeyBkaXNwb3NpdGlvbjogXCJzdWZmaXhcIiB9LFxuICogICAgIClcbiAqICAgKVxuICogICAucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKCkpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGRlbGltaXRlciBEZWxpbWl0ZXIgYnl0ZSBzZXF1ZW5jZVxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIHRyYW5zZm9ybSBzdHJlYW1cbiAqIEByZXR1cm5zIFRyYW5zZm9ybSBzdHJlYW1cbiAqL1xuZXhwb3J0IGNsYXNzIERlbGltaXRlclN0cmVhbSBleHRlbmRzIFRyYW5zZm9ybVN0cmVhbTxVaW50OEFycmF5LCBVaW50OEFycmF5PiB7XG4gICNidWZzID0gbmV3IEJ5dGVzTGlzdCgpO1xuICAjZGVsaW1pdGVyOiBVaW50OEFycmF5O1xuICAjaW5zcGVjdEluZGV4ID0gMDtcbiAgI21hdGNoSW5kZXggPSAwO1xuICAjZGVsaW1MZW46IG51bWJlcjtcbiAgI2RlbGltTFBTOiBVaW50OEFycmF5O1xuICAjZGlzcD86IERlbGltaXRlckRpc3Bvc2l0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGRlbGltaXRlcjogVWludDhBcnJheSxcbiAgICBvcHRpb25zPzogRGVsaW1pdGVyU3RyZWFtT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHJhbnNmb3JtOiAoY2h1bmssIGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgdGhpcy4jaGFuZGxlKGNodW5rLCBjb250cm9sbGVyKTtcbiAgICAgIH0sXG4gICAgICBmbHVzaDogKGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKHRoaXMuI2J1ZnMuY29uY2F0KCkpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuI2RlbGltaXRlciA9IGRlbGltaXRlcjtcbiAgICB0aGlzLiNkZWxpbUxlbiA9IGRlbGltaXRlci5sZW5ndGg7XG4gICAgdGhpcy4jZGVsaW1MUFMgPSBjcmVhdGVMUFMoZGVsaW1pdGVyKTtcbiAgICB0aGlzLiNkaXNwID0gb3B0aW9ucz8uZGlzcG9zaXRpb24gPz8gXCJkaXNjYXJkXCI7XG4gIH1cblxuICAjaGFuZGxlKFxuICAgIGNodW5rOiBVaW50OEFycmF5LFxuICAgIGNvbnRyb2xsZXI6IFRyYW5zZm9ybVN0cmVhbURlZmF1bHRDb250cm9sbGVyPFVpbnQ4QXJyYXk+LFxuICApIHtcbiAgICB0aGlzLiNidWZzLmFkZChjaHVuayk7XG4gICAgbGV0IGxvY2FsSW5kZXggPSAwO1xuICAgIHdoaWxlICh0aGlzLiNpbnNwZWN0SW5kZXggPCB0aGlzLiNidWZzLnNpemUoKSkge1xuICAgICAgaWYgKGNodW5rW2xvY2FsSW5kZXhdID09PSB0aGlzLiNkZWxpbWl0ZXJbdGhpcy4jbWF0Y2hJbmRleF0pIHtcbiAgICAgICAgdGhpcy4jaW5zcGVjdEluZGV4Kys7XG4gICAgICAgIGxvY2FsSW5kZXgrKztcbiAgICAgICAgdGhpcy4jbWF0Y2hJbmRleCsrO1xuICAgICAgICBpZiAodGhpcy4jbWF0Y2hJbmRleCA9PT0gdGhpcy4jZGVsaW1MZW4pIHtcbiAgICAgICAgICAvLyBGdWxsIG1hdGNoXG4gICAgICAgICAgY29uc3Qgc3RhcnQgPSB0aGlzLiNpbnNwZWN0SW5kZXggLSB0aGlzLiNkZWxpbUxlbjtcbiAgICAgICAgICBjb25zdCBlbmQgPSB0aGlzLiNkaXNwID09IFwic3VmZml4XCIgPyB0aGlzLiNpbnNwZWN0SW5kZXggOiBzdGFydDtcbiAgICAgICAgICBjb25zdCBjb3B5ID0gdGhpcy4jYnVmcy5zbGljZSgwLCBlbmQpO1xuICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjb3B5KTtcbiAgICAgICAgICBjb25zdCBzaGlmdCA9IHRoaXMuI2Rpc3AgPT0gXCJwcmVmaXhcIiA/IHN0YXJ0IDogdGhpcy4jaW5zcGVjdEluZGV4O1xuICAgICAgICAgIHRoaXMuI2J1ZnMuc2hpZnQoc2hpZnQpO1xuICAgICAgICAgIHRoaXMuI2luc3BlY3RJbmRleCA9IHRoaXMuI2Rpc3AgPT0gXCJwcmVmaXhcIiA/IHRoaXMuI2RlbGltTGVuIDogMDtcbiAgICAgICAgICB0aGlzLiNtYXRjaEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuI21hdGNoSW5kZXggPT09IDApIHtcbiAgICAgICAgICB0aGlzLiNpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgICBsb2NhbEluZGV4Kys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jbWF0Y2hJbmRleCA9IHRoaXMuI2RlbGltTFBTW3RoaXMuI21hdGNoSW5kZXggLSAxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEseUJBQXlCO0FBQ25ELFNBQVMsU0FBUyxRQUFRLGVBQWU7QUFpQnpDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0JDLEdBQ0QsT0FBTyxNQUFNLHdCQUF3QjtJQUNuQyxDQUFDLElBQUksR0FBRyxJQUFJLFlBQVk7SUFDeEIsQ0FBQyxTQUFTLENBQWE7SUFDdkIsQ0FBQyxZQUFZLEdBQUcsRUFBRTtJQUNsQixDQUFDLFVBQVUsR0FBRyxFQUFFO0lBQ2hCLENBQUMsUUFBUSxDQUFTO0lBQ2xCLENBQUMsUUFBUSxDQUFhO0lBQ3RCLENBQUMsSUFBSSxDQUF3QjtJQUU3QixZQUNFLFNBQXFCLEVBQ3JCLE9BQWdDLENBQ2hDO1FBQ0EsS0FBSyxDQUFDO1lBQ0osV0FBVyxDQUFDLE9BQU87Z0JBQ2pCLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPO1lBQ3RCO1lBQ0EsT0FBTyxDQUFDO2dCQUNOLFdBQVcsUUFBUSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDaEM7UUFDRjtRQUVBLElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRztRQUNsQixJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsVUFBVTtRQUMzQixJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsVUFBVTtRQUMzQixJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUcsU0FBUyxlQUFlO0lBQ3ZDO0lBRUEsQ0FBQyxNQUFNLENBQ0wsS0FBaUIsRUFDakIsVUFBd0Q7UUFFeEQsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUk7UUFDZixJQUFJLGFBQWE7UUFDakIsTUFBTyxJQUFJLENBQUMsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQVE7WUFDN0MsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDM0QsSUFBSSxDQUFDLENBQUMsWUFBWTtnQkFDbEI7Z0JBQ0EsSUFBSSxDQUFDLENBQUMsVUFBVTtnQkFDaEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFO29CQUN2QyxhQUFhO29CQUNiLE1BQU0sUUFBUSxJQUFJLENBQUMsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsUUFBUTtvQkFDakQsTUFBTSxNQUFNLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxXQUFXLElBQUksQ0FBQyxDQUFDLFlBQVksR0FBRztvQkFDMUQsTUFBTSxPQUFPLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUc7b0JBQ2pDLFdBQVcsUUFBUTtvQkFDbkIsTUFBTSxRQUFRLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxXQUFXLFFBQVEsSUFBSSxDQUFDLENBQUMsWUFBWTtvQkFDakUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU07b0JBQ2pCLElBQUksQ0FBQyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksV0FBVyxJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUc7b0JBQy9ELElBQUksQ0FBQyxDQUFDLFVBQVUsR0FBRztnQkFDckI7WUFDRixPQUFPO2dCQUNMLElBQUksSUFBSSxDQUFDLENBQUMsVUFBVSxLQUFLLEdBQUc7b0JBQzFCLElBQUksQ0FBQyxDQUFDLFlBQVk7b0JBQ2xCO2dCQUNGLE9BQU87b0JBQ0wsSUFBSSxDQUFDLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLEdBQUcsRUFBRTtnQkFDekQ7WUFDRjtRQUNGO0lBQ0Y7QUFDRiJ9