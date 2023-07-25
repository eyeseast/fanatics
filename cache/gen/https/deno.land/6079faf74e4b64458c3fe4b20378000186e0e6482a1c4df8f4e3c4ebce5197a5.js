// Originally ported from Go:
// https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/assert.ts";
export const defaultReadOptions = {
    separator: ",",
    trimLeadingSpace: false
};
export async function parseRecord(line, reader, opt, startLine, lineIndex = startLine) {
    // line starting with comment character is ignored
    if (opt.comment && line[0] === opt.comment) {
        return [];
    }
    assert(opt.separator != null);
    let fullLine = line;
    let quoteError = null;
    const quote = '"';
    const quoteLen = quote.length;
    const separatorLen = opt.separator.length;
    let recordBuffer = "";
    const fieldIndexes = [];
    parseField: for(;;){
        if (opt.trimLeadingSpace) {
            line = line.trimStart();
        }
        if (line.length === 0 || !line.startsWith(quote)) {
            // Non-quoted string field
            const i = line.indexOf(opt.separator);
            let field = line;
            if (i >= 0) {
                field = field.substring(0, i);
            }
            // Check to make sure a quote does not appear in field.
            if (!opt.lazyQuotes) {
                const j = field.indexOf(quote);
                if (j >= 0) {
                    const col = runeCount(fullLine.slice(0, fullLine.length - line.slice(j).length));
                    quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_BARE_QUOTE);
                    break parseField;
                }
            }
            recordBuffer += field;
            fieldIndexes.push(recordBuffer.length);
            if (i >= 0) {
                line = line.substring(i + separatorLen);
                continue parseField;
            }
            break parseField;
        } else {
            // Quoted string field
            line = line.substring(quoteLen);
            for(;;){
                const i = line.indexOf(quote);
                if (i >= 0) {
                    // Hit next quote.
                    recordBuffer += line.substring(0, i);
                    line = line.substring(i + quoteLen);
                    if (line.startsWith(quote)) {
                        // `""` sequence (append quote).
                        recordBuffer += quote;
                        line = line.substring(quoteLen);
                    } else if (line.startsWith(opt.separator)) {
                        // `","` sequence (end of field).
                        line = line.substring(separatorLen);
                        fieldIndexes.push(recordBuffer.length);
                        continue parseField;
                    } else if (0 === line.length) {
                        // `"\n` sequence (end of line).
                        fieldIndexes.push(recordBuffer.length);
                        break parseField;
                    } else if (opt.lazyQuotes) {
                        // `"` sequence (bare quote).
                        recordBuffer += quote;
                    } else {
                        // `"*` sequence (invalid non-escaped quote).
                        const col = runeCount(fullLine.slice(0, fullLine.length - line.length - quoteLen));
                        quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_QUOTE);
                        break parseField;
                    }
                } else if (line.length > 0 || !reader.isEOF()) {
                    // Hit end of line (copy all data so far).
                    recordBuffer += line;
                    const r = await reader.readLine();
                    lineIndex++;
                    line = r ?? ""; // This is a workaround for making this module behave similarly to the encoding/csv/reader.go.
                    fullLine = line;
                    if (r === null) {
                        // Abrupt end of file (EOF or error).
                        if (!opt.lazyQuotes) {
                            const col = runeCount(fullLine);
                            quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_QUOTE);
                            break parseField;
                        }
                        fieldIndexes.push(recordBuffer.length);
                        break parseField;
                    }
                    recordBuffer += "\n"; // preserve line feed (This is because TextProtoReader removes it.)
                } else {
                    // Abrupt end of file (EOF on error).
                    if (!opt.lazyQuotes) {
                        const col = runeCount(fullLine);
                        quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_QUOTE);
                        break parseField;
                    }
                    fieldIndexes.push(recordBuffer.length);
                    break parseField;
                }
            }
        }
    }
    if (quoteError) {
        throw quoteError;
    }
    const result = [];
    let preIdx = 0;
    for (const i of fieldIndexes){
        result.push(recordBuffer.slice(preIdx, i));
        preIdx = i;
    }
    return result;
}
function runeCount(s) {
    // Array.from considers the surrogate pair.
    return Array.from(s).length;
}
/**
 * A ParseError is returned for parsing errors.
 * Line numbers are 1-indexed and columns are 0-indexed.
 */ export class ParseError extends SyntaxError {
    /** Line where the record starts*/ startLine;
    /** Line where the error occurred */ line;
    /** Column (rune index) where the error occurred */ column;
    constructor(start, line, column, message){
        super();
        this.startLine = start;
        this.column = column;
        this.line = line;
        if (message === ERR_FIELD_COUNT) {
            this.message = `record on line ${line}: ${message}`;
        } else if (start !== line) {
            this.message = `record on line ${start}; parse error on line ${line}, column ${column}: ${message}`;
        } else {
            this.message = `parse error on line ${line}, column ${column}: ${message}`;
        }
    }
}
export const ERR_BARE_QUOTE = 'bare " in non-quoted-field';
export const ERR_QUOTE = 'extraneous or missing " in quoted-field';
export const ERR_INVALID_DELIM = "Invalid Delimiter";
export const ERR_FIELD_COUNT = "wrong number of fields";
export function convertRowToObject(row, headers, index) {
    if (row.length !== headers.length) {
        throw new Error(`Error number of fields line: ${index}\nNumber of fields found: ${headers.length}\nExpected number of fields: ${row.length}`);
    }
    const out = {};
    for(let i = 0; i < row.length; i++){
        out[headers[i]] = row[i];
    }
    return out;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL2Nzdi9faW8udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gT3JpZ2luYWxseSBwb3J0ZWQgZnJvbSBHbzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9nbzEuMTIuNS9zcmMvZW5jb2RpbmcvY3N2L1xuLy8gQ29weXJpZ2h0IDIwMTEgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIEJTRCBsaWNlbnNlLlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvbGFuZy9nby9ibG9iL21hc3Rlci9MSUNFTlNFXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL2Fzc2VydC9hc3NlcnQudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBSZWFkT3B0aW9ucyB7XG4gIC8qKiBDaGFyYWN0ZXIgd2hpY2ggc2VwYXJhdGVzIHZhbHVlcy5cbiAgICpcbiAgICogQGRlZmF1bHQge1wiLFwifVxuICAgKi9cbiAgc2VwYXJhdG9yPzogc3RyaW5nO1xuICAvKiogQ2hhcmFjdGVyIHRvIHN0YXJ0IGEgY29tbWVudC5cbiAgICpcbiAgICogTGluZXMgYmVnaW5uaW5nIHdpdGggdGhlIGNvbW1lbnQgY2hhcmFjdGVyIHdpdGhvdXQgcHJlY2VkaW5nIHdoaXRlc3BhY2VcbiAgICogYXJlIGlnbm9yZWQuIFdpdGggbGVhZGluZyB3aGl0ZXNwYWNlIHRoZSBjb21tZW50IGNoYXJhY3RlciBiZWNvbWVzIHBhcnQgb2ZcbiAgICogdGhlIGZpZWxkLCBldmVuIHlvdSBwcm92aWRlIGB0cmltTGVhZGluZ1NwYWNlOiB0cnVlYC5cbiAgICpcbiAgICogQGRlZmF1bHQge1wiI1wifVxuICAgKi9cbiAgY29tbWVudD86IHN0cmluZztcbiAgLyoqIEZsYWcgdG8gdHJpbSB0aGUgbGVhZGluZyBzcGFjZSBvZiB0aGUgdmFsdWUuXG4gICAqXG4gICAqIFRoaXMgaXMgZG9uZSBldmVuIGlmIHRoZSBmaWVsZCBkZWxpbWl0ZXIsIGBzZXBhcmF0b3JgLCBpcyB3aGl0ZSBzcGFjZS5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgdHJpbUxlYWRpbmdTcGFjZT86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBBbGxvdyB1bnF1b3RlZCBxdW90ZSBpbiBhIHF1b3RlZCBmaWVsZCBvciBub24tZG91YmxlLXF1b3RlZCBxdW90ZXMgaW5cbiAgICogcXVvdGVkIGZpZWxkLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBsYXp5UXVvdGVzPzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEVuYWJsaW5nIGNoZWNraW5nIG51bWJlciBvZiBleHBlY3RlZCBmaWVsZHMgZm9yIGVhY2ggcm93LlxuICAgKlxuICAgKiBJZiBwb3NpdGl2ZSwgZWFjaCByZWNvcmQgaXMgcmVxdWlyZWQgdG8gaGF2ZSB0aGUgZ2l2ZW4gbnVtYmVyIG9mIGZpZWxkcy5cbiAgICogSWYgPT0gMCwgaXQgd2lsbCBiZSBzZXQgdG8gdGhlIG51bWJlciBvZiBmaWVsZHMgaW4gdGhlIGZpcnN0IHJvdywgc28gdGhhdFxuICAgKiBmdXR1cmUgcm93cyBtdXN0IGhhdmUgdGhlIHNhbWUgZmllbGQgY291bnQuXG4gICAqIElmIG5lZ2F0aXZlLCBubyBjaGVjayBpcyBtYWRlIGFuZCByZWNvcmRzIG1heSBoYXZlIGEgdmFyaWFibGUgbnVtYmVyIG9mXG4gICAqIGZpZWxkcy5cbiAgICpcbiAgICogSWYgdGhlIHdyb25nIG51bWJlciBvZiBmaWVsZHMgaXMgaW4gYSByb3csIGEgYFBhcnNlRXJyb3JgIGlzIHRocm93bi5cbiAgICovXG4gIGZpZWxkc1BlclJlY29yZD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRSZWFkT3B0aW9uczogUmVhZE9wdGlvbnMgPSB7XG4gIHNlcGFyYXRvcjogXCIsXCIsXG4gIHRyaW1MZWFkaW5nU3BhY2U6IGZhbHNlLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBMaW5lUmVhZGVyIHtcbiAgcmVhZExpbmUoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcbiAgaXNFT0YoKTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlUmVjb3JkKFxuICBsaW5lOiBzdHJpbmcsXG4gIHJlYWRlcjogTGluZVJlYWRlcixcbiAgb3B0OiBSZWFkT3B0aW9ucyxcbiAgc3RhcnRMaW5lOiBudW1iZXIsXG4gIGxpbmVJbmRleDogbnVtYmVyID0gc3RhcnRMaW5lLFxuKTogUHJvbWlzZTxBcnJheTxzdHJpbmc+IHwgbnVsbD4ge1xuICAvLyBsaW5lIHN0YXJ0aW5nIHdpdGggY29tbWVudCBjaGFyYWN0ZXIgaXMgaWdub3JlZFxuICBpZiAob3B0LmNvbW1lbnQgJiYgbGluZVswXSA9PT0gb3B0LmNvbW1lbnQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBhc3NlcnQob3B0LnNlcGFyYXRvciAhPSBudWxsKTtcblxuICBsZXQgZnVsbExpbmUgPSBsaW5lO1xuICBsZXQgcXVvdGVFcnJvcjogUGFyc2VFcnJvciB8IG51bGwgPSBudWxsO1xuICBjb25zdCBxdW90ZSA9ICdcIic7XG4gIGNvbnN0IHF1b3RlTGVuID0gcXVvdGUubGVuZ3RoO1xuICBjb25zdCBzZXBhcmF0b3JMZW4gPSBvcHQuc2VwYXJhdG9yLmxlbmd0aDtcbiAgbGV0IHJlY29yZEJ1ZmZlciA9IFwiXCI7XG4gIGNvbnN0IGZpZWxkSW5kZXhlcyA9IFtdIGFzIG51bWJlcltdO1xuICBwYXJzZUZpZWxkOlxuICBmb3IgKDs7KSB7XG4gICAgaWYgKG9wdC50cmltTGVhZGluZ1NwYWNlKSB7XG4gICAgICBsaW5lID0gbGluZS50cmltU3RhcnQoKTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5sZW5ndGggPT09IDAgfHwgIWxpbmUuc3RhcnRzV2l0aChxdW90ZSkpIHtcbiAgICAgIC8vIE5vbi1xdW90ZWQgc3RyaW5nIGZpZWxkXG4gICAgICBjb25zdCBpID0gbGluZS5pbmRleE9mKG9wdC5zZXBhcmF0b3IpO1xuICAgICAgbGV0IGZpZWxkID0gbGluZTtcbiAgICAgIGlmIChpID49IDApIHtcbiAgICAgICAgZmllbGQgPSBmaWVsZC5zdWJzdHJpbmcoMCwgaSk7XG4gICAgICB9XG4gICAgICAvLyBDaGVjayB0byBtYWtlIHN1cmUgYSBxdW90ZSBkb2VzIG5vdCBhcHBlYXIgaW4gZmllbGQuXG4gICAgICBpZiAoIW9wdC5sYXp5UXVvdGVzKSB7XG4gICAgICAgIGNvbnN0IGogPSBmaWVsZC5pbmRleE9mKHF1b3RlKTtcbiAgICAgICAgaWYgKGogPj0gMCkge1xuICAgICAgICAgIGNvbnN0IGNvbCA9IHJ1bmVDb3VudChcbiAgICAgICAgICAgIGZ1bGxMaW5lLnNsaWNlKDAsIGZ1bGxMaW5lLmxlbmd0aCAtIGxpbmUuc2xpY2UoaikubGVuZ3RoKSxcbiAgICAgICAgICApO1xuICAgICAgICAgIHF1b3RlRXJyb3IgPSBuZXcgUGFyc2VFcnJvcihcbiAgICAgICAgICAgIHN0YXJ0TGluZSArIDEsXG4gICAgICAgICAgICBsaW5lSW5kZXgsXG4gICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICBFUlJfQkFSRV9RVU9URSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrIHBhcnNlRmllbGQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlY29yZEJ1ZmZlciArPSBmaWVsZDtcbiAgICAgIGZpZWxkSW5kZXhlcy5wdXNoKHJlY29yZEJ1ZmZlci5sZW5ndGgpO1xuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICBsaW5lID0gbGluZS5zdWJzdHJpbmcoaSArIHNlcGFyYXRvckxlbik7XG4gICAgICAgIGNvbnRpbnVlIHBhcnNlRmllbGQ7XG4gICAgICB9XG4gICAgICBicmVhayBwYXJzZUZpZWxkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBRdW90ZWQgc3RyaW5nIGZpZWxkXG4gICAgICBsaW5lID0gbGluZS5zdWJzdHJpbmcocXVvdGVMZW4pO1xuICAgICAgZm9yICg7Oykge1xuICAgICAgICBjb25zdCBpID0gbGluZS5pbmRleE9mKHF1b3RlKTtcbiAgICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICAgIC8vIEhpdCBuZXh0IHF1b3RlLlxuICAgICAgICAgIHJlY29yZEJ1ZmZlciArPSBsaW5lLnN1YnN0cmluZygwLCBpKTtcbiAgICAgICAgICBsaW5lID0gbGluZS5zdWJzdHJpbmcoaSArIHF1b3RlTGVuKTtcbiAgICAgICAgICBpZiAobGluZS5zdGFydHNXaXRoKHF1b3RlKSkge1xuICAgICAgICAgICAgLy8gYFwiXCJgIHNlcXVlbmNlIChhcHBlbmQgcXVvdGUpLlxuICAgICAgICAgICAgcmVjb3JkQnVmZmVyICs9IHF1b3RlO1xuICAgICAgICAgICAgbGluZSA9IGxpbmUuc3Vic3RyaW5nKHF1b3RlTGVuKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGxpbmUuc3RhcnRzV2l0aChvcHQuc2VwYXJhdG9yKSkge1xuICAgICAgICAgICAgLy8gYFwiLFwiYCBzZXF1ZW5jZSAoZW5kIG9mIGZpZWxkKS5cbiAgICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZyhzZXBhcmF0b3JMZW4pO1xuICAgICAgICAgICAgZmllbGRJbmRleGVzLnB1c2gocmVjb3JkQnVmZmVyLmxlbmd0aCk7XG4gICAgICAgICAgICBjb250aW51ZSBwYXJzZUZpZWxkO1xuICAgICAgICAgIH0gZWxzZSBpZiAoMCA9PT0gbGluZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIGBcIlxcbmAgc2VxdWVuY2UgKGVuZCBvZiBsaW5lKS5cbiAgICAgICAgICAgIGZpZWxkSW5kZXhlcy5wdXNoKHJlY29yZEJ1ZmZlci5sZW5ndGgpO1xuICAgICAgICAgICAgYnJlYWsgcGFyc2VGaWVsZDtcbiAgICAgICAgICB9IGVsc2UgaWYgKG9wdC5sYXp5UXVvdGVzKSB7XG4gICAgICAgICAgICAvLyBgXCJgIHNlcXVlbmNlIChiYXJlIHF1b3RlKS5cbiAgICAgICAgICAgIHJlY29yZEJ1ZmZlciArPSBxdW90ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gYFwiKmAgc2VxdWVuY2UgKGludmFsaWQgbm9uLWVzY2FwZWQgcXVvdGUpLlxuICAgICAgICAgICAgY29uc3QgY29sID0gcnVuZUNvdW50KFxuICAgICAgICAgICAgICBmdWxsTGluZS5zbGljZSgwLCBmdWxsTGluZS5sZW5ndGggLSBsaW5lLmxlbmd0aCAtIHF1b3RlTGVuKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBxdW90ZUVycm9yID0gbmV3IFBhcnNlRXJyb3IoXG4gICAgICAgICAgICAgIHN0YXJ0TGluZSArIDEsXG4gICAgICAgICAgICAgIGxpbmVJbmRleCxcbiAgICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgICBFUlJfUVVPVEUsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnJlYWsgcGFyc2VGaWVsZDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobGluZS5sZW5ndGggPiAwIHx8ICFyZWFkZXIuaXNFT0YoKSkge1xuICAgICAgICAgIC8vIEhpdCBlbmQgb2YgbGluZSAoY29weSBhbGwgZGF0YSBzbyBmYXIpLlxuICAgICAgICAgIHJlY29yZEJ1ZmZlciArPSBsaW5lO1xuICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCByZWFkZXIucmVhZExpbmUoKTtcbiAgICAgICAgICBsaW5lSW5kZXgrKztcbiAgICAgICAgICBsaW5lID0gciA/PyBcIlwiOyAvLyBUaGlzIGlzIGEgd29ya2Fyb3VuZCBmb3IgbWFraW5nIHRoaXMgbW9kdWxlIGJlaGF2ZSBzaW1pbGFybHkgdG8gdGhlIGVuY29kaW5nL2Nzdi9yZWFkZXIuZ28uXG4gICAgICAgICAgZnVsbExpbmUgPSBsaW5lO1xuICAgICAgICAgIGlmIChyID09PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBBYnJ1cHQgZW5kIG9mIGZpbGUgKEVPRiBvciBlcnJvcikuXG4gICAgICAgICAgICBpZiAoIW9wdC5sYXp5UXVvdGVzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbCA9IHJ1bmVDb3VudChmdWxsTGluZSk7XG4gICAgICAgICAgICAgIHF1b3RlRXJyb3IgPSBuZXcgUGFyc2VFcnJvcihcbiAgICAgICAgICAgICAgICBzdGFydExpbmUgKyAxLFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleCxcbiAgICAgICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICAgICAgRVJSX1FVT1RFLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBicmVhayBwYXJzZUZpZWxkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmllbGRJbmRleGVzLnB1c2gocmVjb3JkQnVmZmVyLmxlbmd0aCk7XG4gICAgICAgICAgICBicmVhayBwYXJzZUZpZWxkO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWNvcmRCdWZmZXIgKz0gXCJcXG5cIjsgLy8gcHJlc2VydmUgbGluZSBmZWVkIChUaGlzIGlzIGJlY2F1c2UgVGV4dFByb3RvUmVhZGVyIHJlbW92ZXMgaXQuKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFicnVwdCBlbmQgb2YgZmlsZSAoRU9GIG9uIGVycm9yKS5cbiAgICAgICAgICBpZiAoIW9wdC5sYXp5UXVvdGVzKSB7XG4gICAgICAgICAgICBjb25zdCBjb2wgPSBydW5lQ291bnQoZnVsbExpbmUpO1xuICAgICAgICAgICAgcXVvdGVFcnJvciA9IG5ldyBQYXJzZUVycm9yKFxuICAgICAgICAgICAgICBzdGFydExpbmUgKyAxLFxuICAgICAgICAgICAgICBsaW5lSW5kZXgsXG4gICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgRVJSX1FVT1RFLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrIHBhcnNlRmllbGQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZpZWxkSW5kZXhlcy5wdXNoKHJlY29yZEJ1ZmZlci5sZW5ndGgpO1xuICAgICAgICAgIGJyZWFrIHBhcnNlRmllbGQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHF1b3RlRXJyb3IpIHtcbiAgICB0aHJvdyBxdW90ZUVycm9yO1xuICB9XG4gIGNvbnN0IHJlc3VsdCA9IFtdIGFzIHN0cmluZ1tdO1xuICBsZXQgcHJlSWR4ID0gMDtcbiAgZm9yIChjb25zdCBpIG9mIGZpZWxkSW5kZXhlcykge1xuICAgIHJlc3VsdC5wdXNoKHJlY29yZEJ1ZmZlci5zbGljZShwcmVJZHgsIGkpKTtcbiAgICBwcmVJZHggPSBpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHJ1bmVDb3VudChzOiBzdHJpbmcpOiBudW1iZXIge1xuICAvLyBBcnJheS5mcm9tIGNvbnNpZGVycyB0aGUgc3Vycm9nYXRlIHBhaXIuXG4gIHJldHVybiBBcnJheS5mcm9tKHMpLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBBIFBhcnNlRXJyb3IgaXMgcmV0dXJuZWQgZm9yIHBhcnNpbmcgZXJyb3JzLlxuICogTGluZSBudW1iZXJzIGFyZSAxLWluZGV4ZWQgYW5kIGNvbHVtbnMgYXJlIDAtaW5kZXhlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFBhcnNlRXJyb3IgZXh0ZW5kcyBTeW50YXhFcnJvciB7XG4gIC8qKiBMaW5lIHdoZXJlIHRoZSByZWNvcmQgc3RhcnRzKi9cbiAgc3RhcnRMaW5lOiBudW1iZXI7XG4gIC8qKiBMaW5lIHdoZXJlIHRoZSBlcnJvciBvY2N1cnJlZCAqL1xuICBsaW5lOiBudW1iZXI7XG4gIC8qKiBDb2x1bW4gKHJ1bmUgaW5kZXgpIHdoZXJlIHRoZSBlcnJvciBvY2N1cnJlZCAqL1xuICBjb2x1bW46IG51bWJlciB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgc3RhcnQ6IG51bWJlcixcbiAgICBsaW5lOiBudW1iZXIsXG4gICAgY29sdW1uOiBudW1iZXIgfCBudWxsLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnN0YXJ0TGluZSA9IHN0YXJ0O1xuICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICAgIHRoaXMubGluZSA9IGxpbmU7XG5cbiAgICBpZiAobWVzc2FnZSA9PT0gRVJSX0ZJRUxEX0NPVU5UKSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBgcmVjb3JkIG9uIGxpbmUgJHtsaW5lfTogJHttZXNzYWdlfWA7XG4gICAgfSBlbHNlIGlmIChzdGFydCAhPT0gbGluZSkge1xuICAgICAgdGhpcy5tZXNzYWdlID1cbiAgICAgICAgYHJlY29yZCBvbiBsaW5lICR7c3RhcnR9OyBwYXJzZSBlcnJvciBvbiBsaW5lICR7bGluZX0sIGNvbHVtbiAke2NvbHVtbn06ICR7bWVzc2FnZX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPVxuICAgICAgICBgcGFyc2UgZXJyb3Igb24gbGluZSAke2xpbmV9LCBjb2x1bW4gJHtjb2x1bW59OiAke21lc3NhZ2V9YDtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IEVSUl9CQVJFX1FVT1RFID0gJ2JhcmUgXCIgaW4gbm9uLXF1b3RlZC1maWVsZCc7XG5leHBvcnQgY29uc3QgRVJSX1FVT1RFID0gJ2V4dHJhbmVvdXMgb3IgbWlzc2luZyBcIiBpbiBxdW90ZWQtZmllbGQnO1xuZXhwb3J0IGNvbnN0IEVSUl9JTlZBTElEX0RFTElNID0gXCJJbnZhbGlkIERlbGltaXRlclwiO1xuZXhwb3J0IGNvbnN0IEVSUl9GSUVMRF9DT1VOVCA9IFwid3JvbmcgbnVtYmVyIG9mIGZpZWxkc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFJvd1RvT2JqZWN0KFxuICByb3c6IHN0cmluZ1tdLFxuICBoZWFkZXJzOiByZWFkb25seSBzdHJpbmdbXSxcbiAgaW5kZXg6IG51bWJlcixcbikge1xuICBpZiAocm93Lmxlbmd0aCAhPT0gaGVhZGVycy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXJyb3IgbnVtYmVyIG9mIGZpZWxkcyBsaW5lOiAke2luZGV4fVxcbk51bWJlciBvZiBmaWVsZHMgZm91bmQ6ICR7aGVhZGVycy5sZW5ndGh9XFxuRXhwZWN0ZWQgbnVtYmVyIG9mIGZpZWxkczogJHtyb3cubGVuZ3RofWAsXG4gICAgKTtcbiAgfVxuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm93Lmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0W2hlYWRlcnNbaV1dID0gcm93W2ldO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIGRlbm8tZm10LWlnbm9yZVxuZXhwb3J0IHR5cGUgUGFyc2VSZXN1bHQ8UGFyc2VPcHRpb25zLCBUPiA9XG4gIC8vIElmIGBjb2x1bW5zYCBvcHRpb24gaXMgc3BlY2lmaWVkLCB0aGUgcmV0dXJuIHR5cGUgaXMgUmVjb3JkIHR5cGUuXG4gIFQgZXh0ZW5kcyBQYXJzZU9wdGlvbnMgJiB7IGNvbHVtbnM6IHJlYWRvbmx5IChpbmZlciBDIGV4dGVuZHMgc3RyaW5nKVtdIH1cbiAgICA/IFJlY29yZFdpdGhDb2x1bW48Qz5bXVxuICAvLyBJZiBgc2tpcEZpcnN0Um93YCBvcHRpb24gaXMgc3BlY2lmaWVkLCB0aGUgcmV0dXJuIHR5cGUgaXMgUmVjb3JkIHR5cGUuXG4gIDogVCBleHRlbmRzIFBhcnNlT3B0aW9ucyAmIHsgc2tpcEZpcnN0Um93OiB0cnVlIH1cbiAgICA/IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD5bXVxuICAvLyBJZiBgY29sdW1uc2AgYW5kIGBza2lwRmlyc3RSb3dgIG9wdGlvbiBpcyBfbm90XyBzcGVjaWZpZWQsIHRoZSByZXR1cm4gdHlwZSBpcyBzdHJpbmdbXVtdLlxuICA6IFQgZXh0ZW5kcyBQYXJzZU9wdGlvbnMgJiB7IGNvbHVtbnM/OiB1bmRlZmluZWQ7IHNraXBGaXJzdFJvdz86IGZhbHNlIHwgdW5kZWZpbmVkIH1cbiAgICA/IHN0cmluZ1tdW11cbiAgLy8gZWxzZSwgdGhlIHJldHVybiB0eXBlIGlzIFJlY29yZCB0eXBlIG9yIHN0cmluZ1tdW10uXG4gIDogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPltdIHwgc3RyaW5nW11bXTtcblxuLy8gUmVjb3JkV2l0aENvbHVtbjxcImFhYVwifFwiYmJiXCI+ID0+IFJlY29yZDxcImFhYVwifFwiYmJiXCIsIHN0cmluZz5cbi8vIFJlY29yZFdpdGhDb2x1bW48c3RyaW5nPiA9PiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCB1bmRlZmluZWQ+XG50eXBlIFJlY29yZFdpdGhDb2x1bW48QyBleHRlbmRzIHN0cmluZz4gPSBzdHJpbmcgZXh0ZW5kcyBDXG4gID8gUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPlxuICA6IFJlY29yZDxDLCBzdHJpbmc+O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2QjtBQUM3QiwrREFBK0Q7QUFDL0QsbUVBQW1FO0FBQ25FLG1EQUFtRDtBQUNuRCwwRUFBMEU7QUFDMUUsU0FBUyxNQUFNLFFBQVEsc0JBQXNCO0FBNkM3QyxPQUFPLE1BQU0scUJBQWtDO0lBQzdDLFdBQVc7SUFDWCxrQkFBa0I7QUFDcEIsRUFBRTtBQU9GLE9BQU8sZUFBZSxZQUNwQixJQUFZLEVBQ1osTUFBa0IsRUFDbEIsR0FBZ0IsRUFDaEIsU0FBaUIsRUFDakIsWUFBb0IsU0FBUztJQUU3QixrREFBa0Q7SUFDbEQsSUFBSSxJQUFJLFdBQVcsSUFBSSxDQUFDLEVBQUUsS0FBSyxJQUFJLFNBQVM7UUFDMUMsT0FBTyxFQUFFO0lBQ1g7SUFFQSxPQUFPLElBQUksYUFBYTtJQUV4QixJQUFJLFdBQVc7SUFDZixJQUFJLGFBQWdDO0lBQ3BDLE1BQU0sUUFBUTtJQUNkLE1BQU0sV0FBVyxNQUFNO0lBQ3ZCLE1BQU0sZUFBZSxJQUFJLFVBQVU7SUFDbkMsSUFBSSxlQUFlO0lBQ25CLE1BQU0sZUFBZSxFQUFFO0lBQ3ZC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