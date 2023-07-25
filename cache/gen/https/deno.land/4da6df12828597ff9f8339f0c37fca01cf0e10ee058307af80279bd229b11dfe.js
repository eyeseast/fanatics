// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export const DEFAULT_CHUNK_SIZE = 16_640;
export const DEFAULT_BUFFER_SIZE = 32 * 1024;
/** Generate longest proper prefix which is also suffix array. */ export function createLPS(pat) {
    const lps = new Uint8Array(pat.length);
    lps[0] = 0;
    let prefixEnd = 0;
    let i = 1;
    while(i < lps.length){
        if (pat[i] == pat[prefixEnd]) {
            prefixEnd++;
            lps[i] = prefixEnd;
            i++;
        } else if (prefixEnd === 0) {
            lps[i] = 0;
            i++;
        } else {
            prefixEnd = lps[prefixEnd - 1];
        }
    }
    return lps;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL3N0cmVhbXMvX2NvbW1vbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9DSFVOS19TSVpFID0gMTZfNjQwO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfQlVGRkVSX1NJWkUgPSAzMiAqIDEwMjQ7XG5cbi8qKiBHZW5lcmF0ZSBsb25nZXN0IHByb3BlciBwcmVmaXggd2hpY2ggaXMgYWxzbyBzdWZmaXggYXJyYXkuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFBTKHBhdDogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBscHMgPSBuZXcgVWludDhBcnJheShwYXQubGVuZ3RoKTtcbiAgbHBzWzBdID0gMDtcbiAgbGV0IHByZWZpeEVuZCA9IDA7XG4gIGxldCBpID0gMTtcbiAgd2hpbGUgKGkgPCBscHMubGVuZ3RoKSB7XG4gICAgaWYgKHBhdFtpXSA9PSBwYXRbcHJlZml4RW5kXSkge1xuICAgICAgcHJlZml4RW5kKys7XG4gICAgICBscHNbaV0gPSBwcmVmaXhFbmQ7XG4gICAgICBpKys7XG4gICAgfSBlbHNlIGlmIChwcmVmaXhFbmQgPT09IDApIHtcbiAgICAgIGxwc1tpXSA9IDA7XG4gICAgICBpKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZWZpeEVuZCA9IGxwc1twcmVmaXhFbmQgLSAxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxwcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLE9BQU8sTUFBTSxxQkFBcUIsT0FBTztBQUN6QyxPQUFPLE1BQU0sc0JBQXNCLEtBQUssS0FBSztBQUU3QywrREFBK0QsR0FDL0QsT0FBTyxTQUFTLFVBQVUsR0FBZTtJQUN2QyxNQUFNLE1BQU0sSUFBSSxXQUFXLElBQUk7SUFDL0IsR0FBRyxDQUFDLEVBQUUsR0FBRztJQUNULElBQUksWUFBWTtJQUNoQixJQUFJLElBQUk7SUFDUixNQUFPLElBQUksSUFBSSxPQUFRO1FBQ3JCLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLENBQUMsVUFBVSxFQUFFO1lBQzVCO1lBQ0EsR0FBRyxDQUFDLEVBQUUsR0FBRztZQUNUO1FBQ0YsT0FBTyxJQUFJLGNBQWMsR0FBRztZQUMxQixHQUFHLENBQUMsRUFBRSxHQUFHO1lBQ1Q7UUFDRixPQUFPO1lBQ0wsWUFBWSxHQUFHLENBQUMsWUFBWSxFQUFFO1FBQ2hDO0lBQ0Y7SUFDQSxPQUFPO0FBQ1QifQ==