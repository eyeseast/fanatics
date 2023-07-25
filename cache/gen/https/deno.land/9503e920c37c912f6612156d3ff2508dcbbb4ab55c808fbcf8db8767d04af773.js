// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { convertRowToObject, ERR_BARE_QUOTE, ERR_FIELD_COUNT, ERR_INVALID_DELIM, ERR_QUOTE, ParseError } from "./_io.ts";
import { assert } from "../assert/assert.ts";
export { ERR_BARE_QUOTE, ERR_FIELD_COUNT, ERR_INVALID_DELIM, ERR_QUOTE, ParseError };
const BYTE_ORDER_MARK = "\ufeff";
class Parser {
    #input = "";
    #cursor = 0;
    #options;
    constructor({ separator ="," , trimLeadingSpace =false , comment , lazyQuotes , fieldsPerRecord  } = {}){
        this.#options = {
            separator,
            trimLeadingSpace,
            comment,
            lazyQuotes,
            fieldsPerRecord
        };
    }
    #readLine() {
        if (this.#isEOF()) return null;
        if (!this.#input.startsWith("\r\n", this.#cursor) || !this.#input.startsWith("\n", this.#cursor)) {
            let buffer = "";
            let hadNewline = false;
            while(this.#cursor < this.#input.length){
                if (this.#input.startsWith("\r\n", this.#cursor)) {
                    hadNewline = true;
                    this.#cursor += 2;
                    break;
                }
                if (this.#input.startsWith("\n", this.#cursor)) {
                    hadNewline = true;
                    this.#cursor += 1;
                    break;
                }
                buffer += this.#input[this.#cursor];
                this.#cursor += 1;
            }
            if (!hadNewline && buffer.endsWith("\r")) {
                buffer = buffer.slice(0, -1);
            }
            return buffer;
        }
        return null;
    }
    #isEOF() {
        return this.#cursor >= this.#input.length;
    }
    #parseRecord(startLine) {
        let line = this.#readLine();
        if (line === null) return null;
        if (line.length === 0) {
            return [];
        }
        function runeCount(s) {
            // Array.from considers the surrogate pair.
            return Array.from(s).length;
        }
        let lineIndex = startLine + 1;
        // line starting with comment character is ignored
        if (this.#options.comment && line[0] === this.#options.comment) {
            return [];
        }
        assert(this.#options.separator != null);
        let fullLine = line;
        let quoteError = null;
        const quote = '"';
        const quoteLen = quote.length;
        const separatorLen = this.#options.separator.length;
        let recordBuffer = "";
        const fieldIndexes = [];
        parseField: for(;;){
            if (this.#options.trimLeadingSpace) {
                line = line.trimStart();
            }
            if (line.length === 0 || !line.startsWith(quote)) {
                // Non-quoted string field
                const i = line.indexOf(this.#options.separator);
                let field = line;
                if (i >= 0) {
                    field = field.substring(0, i);
                }
                // Check to make sure a quote does not appear in field.
                if (!this.#options.lazyQuotes) {
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
                        } else if (line.startsWith(this.#options.separator)) {
                            // `","` sequence (end of field).
                            line = line.substring(separatorLen);
                            fieldIndexes.push(recordBuffer.length);
                            continue parseField;
                        } else if (0 === line.length) {
                            // `"\n` sequence (end of line).
                            fieldIndexes.push(recordBuffer.length);
                            break parseField;
                        } else if (this.#options.lazyQuotes) {
                            // `"` sequence (bare quote).
                            recordBuffer += quote;
                        } else {
                            // `"*` sequence (invalid non-escaped quote).
                            const col = runeCount(fullLine.slice(0, fullLine.length - line.length - quoteLen));
                            quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_QUOTE);
                            break parseField;
                        }
                    } else if (line.length > 0 || !this.#isEOF()) {
                        // Hit end of line (copy all data so far).
                        recordBuffer += line;
                        const r = this.#readLine();
                        lineIndex++;
                        line = r ?? ""; // This is a workaround for making this module behave similarly to the encoding/csv/reader.go.
                        fullLine = line;
                        if (r === null) {
                            // Abrupt end of file (EOF or error).
                            if (!this.#options.lazyQuotes) {
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
                        if (!this.#options.lazyQuotes) {
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
    parse(input) {
        this.#input = input.startsWith(BYTE_ORDER_MARK) ? input.slice(1) : input;
        this.#cursor = 0;
        const result = [];
        let _nbFields;
        let lineResult;
        let first = true;
        let lineIndex = 0;
        const INVALID_RUNE = [
            "\r",
            "\n",
            '"'
        ];
        const options = this.#options;
        if (INVALID_RUNE.includes(options.separator) || typeof options.comment === "string" && INVALID_RUNE.includes(options.comment) || options.separator === options.comment) {
            throw new Error(ERR_INVALID_DELIM);
        }
        for(;;){
            const r = this.#parseRecord(lineIndex);
            if (r === null) break;
            lineResult = r;
            lineIndex++;
            // If fieldsPerRecord is 0, Read sets it to
            // the number of fields in the first record
            if (first) {
                first = false;
                if (options.fieldsPerRecord !== undefined) {
                    if (options.fieldsPerRecord === 0) {
                        _nbFields = lineResult.length;
                    } else {
                        _nbFields = options.fieldsPerRecord;
                    }
                }
            }
            if (lineResult.length > 0) {
                if (_nbFields && _nbFields !== lineResult.length) {
                    throw new ParseError(lineIndex, lineIndex, null, ERR_FIELD_COUNT);
                }
                result.push(lineResult);
            }
        }
        return result;
    }
}
export function parse(input, opt = {
    skipFirstRow: false
}) {
    const parser = new Parser(opt);
    const r = parser.parse(input);
    if (opt.skipFirstRow || opt.columns) {
        let headers = [];
        if (opt.skipFirstRow) {
            const head = r.shift();
            assert(head != null);
            headers = head;
        }
        if (opt.columns) {
            headers = opt.columns;
        }
        const firstLineIndex = opt.skipFirstRow ? 1 : 0;
        return r.map((row, i)=>{
            return convertRowToObject(row, headers, firstLineIndex + i);
        });
    }
    return r;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL2Nzdi9wYXJzZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQge1xuICBjb252ZXJ0Um93VG9PYmplY3QsXG4gIEVSUl9CQVJFX1FVT1RFLFxuICBFUlJfRklFTERfQ09VTlQsXG4gIEVSUl9JTlZBTElEX0RFTElNLFxuICBFUlJfUVVPVEUsXG4gIFBhcnNlRXJyb3IsXG4gIHR5cGUgUGFyc2VSZXN1bHQsXG4gIHR5cGUgUmVhZE9wdGlvbnMsXG59IGZyb20gXCIuL19pby50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL2Fzc2VydC9hc3NlcnQudHNcIjtcblxuZXhwb3J0IHtcbiAgRVJSX0JBUkVfUVVPVEUsXG4gIEVSUl9GSUVMRF9DT1VOVCxcbiAgRVJSX0lOVkFMSURfREVMSU0sXG4gIEVSUl9RVU9URSxcbiAgUGFyc2VFcnJvcixcbiAgUmVhZE9wdGlvbnMsXG59O1xuXG5jb25zdCBCWVRFX09SREVSX01BUksgPSBcIlxcdWZlZmZcIjtcblxuY2xhc3MgUGFyc2VyIHtcbiAgI2lucHV0ID0gXCJcIjtcbiAgI2N1cnNvciA9IDA7XG4gICNvcHRpb25zOiB7XG4gICAgc2VwYXJhdG9yOiBzdHJpbmc7XG4gICAgdHJpbUxlYWRpbmdTcGFjZTogYm9vbGVhbjtcbiAgICBjb21tZW50Pzogc3RyaW5nO1xuICAgIGxhenlRdW90ZXM/OiBib29sZWFuO1xuICAgIGZpZWxkc1BlclJlY29yZD86IG51bWJlcjtcbiAgfTtcbiAgY29uc3RydWN0b3Ioe1xuICAgIHNlcGFyYXRvciA9IFwiLFwiLFxuICAgIHRyaW1MZWFkaW5nU3BhY2UgPSBmYWxzZSxcbiAgICBjb21tZW50LFxuICAgIGxhenlRdW90ZXMsXG4gICAgZmllbGRzUGVyUmVjb3JkLFxuICB9OiBSZWFkT3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy4jb3B0aW9ucyA9IHtcbiAgICAgIHNlcGFyYXRvcixcbiAgICAgIHRyaW1MZWFkaW5nU3BhY2UsXG4gICAgICBjb21tZW50LFxuICAgICAgbGF6eVF1b3RlcyxcbiAgICAgIGZpZWxkc1BlclJlY29yZCxcbiAgICB9O1xuICB9XG4gICNyZWFkTGluZSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAodGhpcy4jaXNFT0YoKSkgcmV0dXJuIG51bGw7XG5cbiAgICBpZiAoXG4gICAgICAhdGhpcy4jaW5wdXQuc3RhcnRzV2l0aChcIlxcclxcblwiLCB0aGlzLiNjdXJzb3IpIHx8XG4gICAgICAhdGhpcy4jaW5wdXQuc3RhcnRzV2l0aChcIlxcblwiLCB0aGlzLiNjdXJzb3IpXG4gICAgKSB7XG4gICAgICBsZXQgYnVmZmVyID0gXCJcIjtcbiAgICAgIGxldCBoYWROZXdsaW5lID0gZmFsc2U7XG4gICAgICB3aGlsZSAodGhpcy4jY3Vyc29yIDwgdGhpcy4jaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLiNpbnB1dC5zdGFydHNXaXRoKFwiXFxyXFxuXCIsIHRoaXMuI2N1cnNvcikpIHtcbiAgICAgICAgICBoYWROZXdsaW5lID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLiNjdXJzb3IgKz0gMjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy4jaW5wdXQuc3RhcnRzV2l0aChcIlxcblwiLCB0aGlzLiNjdXJzb3IpXG4gICAgICAgICkge1xuICAgICAgICAgIGhhZE5ld2xpbmUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuI2N1cnNvciArPSAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJ1ZmZlciArPSB0aGlzLiNpbnB1dFt0aGlzLiNjdXJzb3JdO1xuICAgICAgICB0aGlzLiNjdXJzb3IgKz0gMTtcbiAgICAgIH1cbiAgICAgIGlmICghaGFkTmV3bGluZSAmJiBidWZmZXIuZW5kc1dpdGgoXCJcXHJcIikpIHtcbiAgICAgICAgYnVmZmVyID0gYnVmZmVyLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgI2lzRU9GKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNjdXJzb3IgPj0gdGhpcy4jaW5wdXQubGVuZ3RoO1xuICB9XG4gICNwYXJzZVJlY29yZChzdGFydExpbmU6IG51bWJlcik6IHN0cmluZ1tdIHwgbnVsbCB7XG4gICAgbGV0IGxpbmUgPSB0aGlzLiNyZWFkTGluZSgpO1xuICAgIGlmIChsaW5lID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICBpZiAobGluZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBydW5lQ291bnQoczogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAgIC8vIEFycmF5LmZyb20gY29uc2lkZXJzIHRoZSBzdXJyb2dhdGUgcGFpci5cbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHMpLmxlbmd0aDtcbiAgICB9XG5cbiAgICBsZXQgbGluZUluZGV4ID0gc3RhcnRMaW5lICsgMTtcblxuICAgIC8vIGxpbmUgc3RhcnRpbmcgd2l0aCBjb21tZW50IGNoYXJhY3RlciBpcyBpZ25vcmVkXG4gICAgaWYgKHRoaXMuI29wdGlvbnMuY29tbWVudCAmJiBsaW5lWzBdID09PSB0aGlzLiNvcHRpb25zLmNvbW1lbnQpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBhc3NlcnQodGhpcy4jb3B0aW9ucy5zZXBhcmF0b3IgIT0gbnVsbCk7XG5cbiAgICBsZXQgZnVsbExpbmUgPSBsaW5lO1xuICAgIGxldCBxdW90ZUVycm9yOiBQYXJzZUVycm9yIHwgbnVsbCA9IG51bGw7XG4gICAgY29uc3QgcXVvdGUgPSAnXCInO1xuICAgIGNvbnN0IHF1b3RlTGVuID0gcXVvdGUubGVuZ3RoO1xuICAgIGNvbnN0IHNlcGFyYXRvckxlbiA9IHRoaXMuI29wdGlvbnMuc2VwYXJhdG9yLmxlbmd0aDtcbiAgICBsZXQgcmVjb3JkQnVmZmVyID0gXCJcIjtcbiAgICBjb25zdCBmaWVsZEluZGV4ZXMgPSBbXSBhcyBudW1iZXJbXTtcbiAgICBwYXJzZUZpZWxkOlxuICAgIGZvciAoOzspIHtcbiAgICAgIGlmICh0aGlzLiNvcHRpb25zLnRyaW1MZWFkaW5nU3BhY2UpIHtcbiAgICAgICAgbGluZSA9IGxpbmUudHJpbVN0YXJ0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChsaW5lLmxlbmd0aCA9PT0gMCB8fCAhbGluZS5zdGFydHNXaXRoKHF1b3RlKSkge1xuICAgICAgICAvLyBOb24tcXVvdGVkIHN0cmluZyBmaWVsZFxuICAgICAgICBjb25zdCBpID0gbGluZS5pbmRleE9mKHRoaXMuI29wdGlvbnMuc2VwYXJhdG9yKTtcbiAgICAgICAgbGV0IGZpZWxkID0gbGluZTtcbiAgICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICAgIGZpZWxkID0gZmllbGQuc3Vic3RyaW5nKDAsIGkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIHRvIG1ha2Ugc3VyZSBhIHF1b3RlIGRvZXMgbm90IGFwcGVhciBpbiBmaWVsZC5cbiAgICAgICAgaWYgKCF0aGlzLiNvcHRpb25zLmxhenlRdW90ZXMpIHtcbiAgICAgICAgICBjb25zdCBqID0gZmllbGQuaW5kZXhPZihxdW90ZSk7XG4gICAgICAgICAgaWYgKGogPj0gMCkge1xuICAgICAgICAgICAgY29uc3QgY29sID0gcnVuZUNvdW50KFxuICAgICAgICAgICAgICBmdWxsTGluZS5zbGljZSgwLCBmdWxsTGluZS5sZW5ndGggLSBsaW5lLnNsaWNlKGopLmxlbmd0aCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcXVvdGVFcnJvciA9IG5ldyBQYXJzZUVycm9yKFxuICAgICAgICAgICAgICBzdGFydExpbmUgKyAxLFxuICAgICAgICAgICAgICBsaW5lSW5kZXgsXG4gICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgRVJSX0JBUkVfUVVPVEUsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnJlYWsgcGFyc2VGaWVsZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVjb3JkQnVmZmVyICs9IGZpZWxkO1xuICAgICAgICBmaWVsZEluZGV4ZXMucHVzaChyZWNvcmRCdWZmZXIubGVuZ3RoKTtcbiAgICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZyhpICsgc2VwYXJhdG9yTGVuKTtcbiAgICAgICAgICBjb250aW51ZSBwYXJzZUZpZWxkO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrIHBhcnNlRmllbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBRdW90ZWQgc3RyaW5nIGZpZWxkXG4gICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZyhxdW90ZUxlbik7XG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBjb25zdCBpID0gbGluZS5pbmRleE9mKHF1b3RlKTtcbiAgICAgICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgICAgICAvLyBIaXQgbmV4dCBxdW90ZS5cbiAgICAgICAgICAgIHJlY29yZEJ1ZmZlciArPSBsaW5lLnN1YnN0cmluZygwLCBpKTtcbiAgICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZyhpICsgcXVvdGVMZW4pO1xuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aChxdW90ZSkpIHtcbiAgICAgICAgICAgICAgLy8gYFwiXCJgIHNlcXVlbmNlIChhcHBlbmQgcXVvdGUpLlxuICAgICAgICAgICAgICByZWNvcmRCdWZmZXIgKz0gcXVvdGU7XG4gICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZyhxdW90ZUxlbik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxpbmUuc3RhcnRzV2l0aCh0aGlzLiNvcHRpb25zLnNlcGFyYXRvcikpIHtcbiAgICAgICAgICAgICAgLy8gYFwiLFwiYCBzZXF1ZW5jZSAoZW5kIG9mIGZpZWxkKS5cbiAgICAgICAgICAgICAgbGluZSA9IGxpbmUuc3Vic3RyaW5nKHNlcGFyYXRvckxlbik7XG4gICAgICAgICAgICAgIGZpZWxkSW5kZXhlcy5wdXNoKHJlY29yZEJ1ZmZlci5sZW5ndGgpO1xuICAgICAgICAgICAgICBjb250aW51ZSBwYXJzZUZpZWxkO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgwID09PSBsaW5lLmxlbmd0aCkge1xuICAgICAgICAgICAgICAvLyBgXCJcXG5gIHNlcXVlbmNlIChlbmQgb2YgbGluZSkuXG4gICAgICAgICAgICAgIGZpZWxkSW5kZXhlcy5wdXNoKHJlY29yZEJ1ZmZlci5sZW5ndGgpO1xuICAgICAgICAgICAgICBicmVhayBwYXJzZUZpZWxkO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNvcHRpb25zLmxhenlRdW90ZXMpIHtcbiAgICAgICAgICAgICAgLy8gYFwiYCBzZXF1ZW5jZSAoYmFyZSBxdW90ZSkuXG4gICAgICAgICAgICAgIHJlY29yZEJ1ZmZlciArPSBxdW90ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGBcIipgIHNlcXVlbmNlIChpbnZhbGlkIG5vbi1lc2NhcGVkIHF1b3RlKS5cbiAgICAgICAgICAgICAgY29uc3QgY29sID0gcnVuZUNvdW50KFxuICAgICAgICAgICAgICAgIGZ1bGxMaW5lLnNsaWNlKDAsIGZ1bGxMaW5lLmxlbmd0aCAtIGxpbmUubGVuZ3RoIC0gcXVvdGVMZW4pLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBxdW90ZUVycm9yID0gbmV3IFBhcnNlRXJyb3IoXG4gICAgICAgICAgICAgICAgc3RhcnRMaW5lICsgMSxcbiAgICAgICAgICAgICAgICBsaW5lSW5kZXgsXG4gICAgICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgICAgIEVSUl9RVU9URSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgYnJlYWsgcGFyc2VGaWVsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGxpbmUubGVuZ3RoID4gMCB8fCAhKHRoaXMuI2lzRU9GKCkpKSB7XG4gICAgICAgICAgICAvLyBIaXQgZW5kIG9mIGxpbmUgKGNvcHkgYWxsIGRhdGEgc28gZmFyKS5cbiAgICAgICAgICAgIHJlY29yZEJ1ZmZlciArPSBsaW5lO1xuICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuI3JlYWRMaW5lKCk7XG4gICAgICAgICAgICBsaW5lSW5kZXgrKztcbiAgICAgICAgICAgIGxpbmUgPSByID8/IFwiXCI7IC8vIFRoaXMgaXMgYSB3b3JrYXJvdW5kIGZvciBtYWtpbmcgdGhpcyBtb2R1bGUgYmVoYXZlIHNpbWlsYXJseSB0byB0aGUgZW5jb2RpbmcvY3N2L3JlYWRlci5nby5cbiAgICAgICAgICAgIGZ1bGxMaW5lID0gbGluZTtcbiAgICAgICAgICAgIGlmIChyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgIC8vIEFicnVwdCBlbmQgb2YgZmlsZSAoRU9GIG9yIGVycm9yKS5cbiAgICAgICAgICAgICAgaWYgKCF0aGlzLiNvcHRpb25zLmxhenlRdW90ZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2wgPSBydW5lQ291bnQoZnVsbExpbmUpO1xuICAgICAgICAgICAgICAgIHF1b3RlRXJyb3IgPSBuZXcgUGFyc2VFcnJvcihcbiAgICAgICAgICAgICAgICAgIHN0YXJ0TGluZSArIDEsXG4gICAgICAgICAgICAgICAgICBsaW5lSW5kZXgsXG4gICAgICAgICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICAgICAgICBFUlJfUVVPVEUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhayBwYXJzZUZpZWxkO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGZpZWxkSW5kZXhlcy5wdXNoKHJlY29yZEJ1ZmZlci5sZW5ndGgpO1xuICAgICAgICAgICAgICBicmVhayBwYXJzZUZpZWxkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVjb3JkQnVmZmVyICs9IFwiXFxuXCI7IC8vIHByZXNlcnZlIGxpbmUgZmVlZCAoVGhpcyBpcyBiZWNhdXNlIFRleHRQcm90b1JlYWRlciByZW1vdmVzIGl0LilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWJydXB0IGVuZCBvZiBmaWxlIChFT0Ygb24gZXJyb3IpLlxuICAgICAgICAgICAgaWYgKCF0aGlzLiNvcHRpb25zLmxhenlRdW90ZXMpIHtcbiAgICAgICAgICAgICAgY29uc3QgY29sID0gcnVuZUNvdW50KGZ1bGxMaW5lKTtcbiAgICAgICAgICAgICAgcXVvdGVFcnJvciA9IG5ldyBQYXJzZUVycm9yKFxuICAgICAgICAgICAgICAgIHN0YXJ0TGluZSArIDEsXG4gICAgICAgICAgICAgICAgbGluZUluZGV4LFxuICAgICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgICBFUlJfUVVPVEUsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGJyZWFrIHBhcnNlRmllbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWVsZEluZGV4ZXMucHVzaChyZWNvcmRCdWZmZXIubGVuZ3RoKTtcbiAgICAgICAgICAgIGJyZWFrIHBhcnNlRmllbGQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChxdW90ZUVycm9yKSB7XG4gICAgICB0aHJvdyBxdW90ZUVycm9yO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBbXSBhcyBzdHJpbmdbXTtcbiAgICBsZXQgcHJlSWR4ID0gMDtcbiAgICBmb3IgKGNvbnN0IGkgb2YgZmllbGRJbmRleGVzKSB7XG4gICAgICByZXN1bHQucHVzaChyZWNvcmRCdWZmZXIuc2xpY2UocHJlSWR4LCBpKSk7XG4gICAgICBwcmVJZHggPSBpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHBhcnNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXVtdIHtcbiAgICB0aGlzLiNpbnB1dCA9IGlucHV0LnN0YXJ0c1dpdGgoQllURV9PUkRFUl9NQVJLKSA/IGlucHV0LnNsaWNlKDEpIDogaW5wdXQ7XG4gICAgdGhpcy4jY3Vyc29yID0gMDtcbiAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdW10gPSBbXTtcbiAgICBsZXQgX25iRmllbGRzOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGxpbmVSZXN1bHQ6IHN0cmluZ1tdO1xuICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgbGV0IGxpbmVJbmRleCA9IDA7XG5cbiAgICBjb25zdCBJTlZBTElEX1JVTkUgPSBbXCJcXHJcIiwgXCJcXG5cIiwgJ1wiJ107XG5cbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy4jb3B0aW9ucztcbiAgICBpZiAoXG4gICAgICBJTlZBTElEX1JVTkUuaW5jbHVkZXMob3B0aW9ucy5zZXBhcmF0b3IpIHx8XG4gICAgICAodHlwZW9mIG9wdGlvbnMuY29tbWVudCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICBJTlZBTElEX1JVTkUuaW5jbHVkZXMob3B0aW9ucy5jb21tZW50KSkgfHxcbiAgICAgIG9wdGlvbnMuc2VwYXJhdG9yID09PSBvcHRpb25zLmNvbW1lbnRcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFUlJfSU5WQUxJRF9ERUxJTSk7XG4gICAgfVxuXG4gICAgZm9yICg7Oykge1xuICAgICAgY29uc3QgciA9IHRoaXMuI3BhcnNlUmVjb3JkKGxpbmVJbmRleCk7XG4gICAgICBpZiAociA9PT0gbnVsbCkgYnJlYWs7XG4gICAgICBsaW5lUmVzdWx0ID0gcjtcbiAgICAgIGxpbmVJbmRleCsrO1xuICAgICAgLy8gSWYgZmllbGRzUGVyUmVjb3JkIGlzIDAsIFJlYWQgc2V0cyBpdCB0b1xuICAgICAgLy8gdGhlIG51bWJlciBvZiBmaWVsZHMgaW4gdGhlIGZpcnN0IHJlY29yZFxuICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIGlmIChvcHRpb25zLmZpZWxkc1BlclJlY29yZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuZmllbGRzUGVyUmVjb3JkID09PSAwKSB7XG4gICAgICAgICAgICBfbmJGaWVsZHMgPSBsaW5lUmVzdWx0Lmxlbmd0aDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX25iRmllbGRzID0gb3B0aW9ucy5maWVsZHNQZXJSZWNvcmQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsaW5lUmVzdWx0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKF9uYkZpZWxkcyAmJiBfbmJGaWVsZHMgIT09IGxpbmVSZXN1bHQubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFBhcnNlRXJyb3IobGluZUluZGV4LCBsaW5lSW5kZXgsIG51bGwsIEVSUl9GSUVMRF9DT1VOVCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0LnB1c2gobGluZVJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZU9wdGlvbnMgZXh0ZW5kcyBSZWFkT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBJZiB5b3UgcHJvdmlkZSBgc2tpcEZpcnN0Um93OiB0cnVlYCBhbmQgYGNvbHVtbnNgLCB0aGUgZmlyc3QgbGluZSB3aWxsIGJlXG4gICAqIHNraXBwZWQuXG4gICAqIElmIHlvdSBwcm92aWRlIGBza2lwRmlyc3RSb3c6IHRydWVgIGJ1dCBub3QgYGNvbHVtbnNgLCB0aGUgZmlyc3QgbGluZSB3aWxsXG4gICAqIGJlIHNraXBwZWQgYW5kIHVzZWQgYXMgaGVhZGVyIGRlZmluaXRpb25zLlxuICAgKi9cbiAgc2tpcEZpcnN0Um93PzogYm9vbGVhbjtcblxuICAvKiogTGlzdCBvZiBuYW1lcyB1c2VkIGZvciBoZWFkZXIgZGVmaW5pdGlvbi4gKi9cbiAgY29sdW1ucz86IHJlYWRvbmx5IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIENzdiBwYXJzZSBoZWxwZXIgdG8gbWFuaXB1bGF0ZSBkYXRhLlxuICogUHJvdmlkZXMgYW4gYXV0by9jdXN0b20gbWFwcGVyIGZvciBjb2x1bW5zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jc3YvcGFyc2UudHNcIjtcbiAqIGNvbnN0IHN0cmluZyA9IFwiYSxiLGNcXG5kLGUsZlwiO1xuICpcbiAqIGNvbnNvbGUubG9nKFxuICogICBhd2FpdCBwYXJzZShzdHJpbmcsIHtcbiAqICAgICBza2lwRmlyc3RSb3c6IGZhbHNlLFxuICogICB9KSxcbiAqICk7XG4gKiAvLyBvdXRwdXQ6XG4gKiAvLyBbW1wiYVwiLCBcImJcIiwgXCJjXCJdLCBbXCJkXCIsIFwiZVwiLCBcImZcIl1dXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gaW5wdXQgSW5wdXQgdG8gcGFyc2UuXG4gKiBAcGFyYW0gb3B0IG9wdGlvbnMgb2YgdGhlIHBhcnNlci5cbiAqIEByZXR1cm5zIElmIHlvdSBkb24ndCBwcm92aWRlIGBvcHQuc2tpcEZpcnN0Um93YCBhbmQgYG9wdC5jb2x1bW5zYCwgaXQgcmV0dXJucyBgc3RyaW5nW11bXWAuXG4gKiAgIElmIHlvdSBwcm92aWRlIGBvcHQuc2tpcEZpcnN0Um93YCBvciBgb3B0LmNvbHVtbnNgLCBpdCByZXR1cm5zIGBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKGlucHV0OiBzdHJpbmcsIG9wdD86IHVuZGVmaW5lZCk6IHN0cmluZ1tdW107XG5leHBvcnQgZnVuY3Rpb24gcGFyc2U8Y29uc3QgVCBleHRlbmRzIFBhcnNlT3B0aW9ucz4oXG4gIGlucHV0OiBzdHJpbmcsXG4gIG9wdDogVCxcbik6IFBhcnNlUmVzdWx0PFBhcnNlT3B0aW9ucywgVD47XG5leHBvcnQgZnVuY3Rpb24gcGFyc2U8Y29uc3QgVCBleHRlbmRzIFBhcnNlT3B0aW9ucz4oXG4gIGlucHV0OiBzdHJpbmcsXG4gIG9wdDogVCA9IHsgc2tpcEZpcnN0Um93OiBmYWxzZSB9IGFzIFQsXG4pOiBQYXJzZVJlc3VsdDxQYXJzZU9wdGlvbnMsIFQ+IHtcbiAgY29uc3QgcGFyc2VyID0gbmV3IFBhcnNlcihvcHQpO1xuICBjb25zdCByID0gcGFyc2VyLnBhcnNlKGlucHV0KTtcblxuICBpZiAob3B0LnNraXBGaXJzdFJvdyB8fCBvcHQuY29sdW1ucykge1xuICAgIGxldCBoZWFkZXJzOiByZWFkb25seSBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKG9wdC5za2lwRmlyc3RSb3cpIHtcbiAgICAgIGNvbnN0IGhlYWQgPSByLnNoaWZ0KCk7XG4gICAgICBhc3NlcnQoaGVhZCAhPSBudWxsKTtcbiAgICAgIGhlYWRlcnMgPSBoZWFkO1xuICAgIH1cblxuICAgIGlmIChvcHQuY29sdW1ucykge1xuICAgICAgaGVhZGVycyA9IG9wdC5jb2x1bW5zO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0TGluZUluZGV4ID0gb3B0LnNraXBGaXJzdFJvdyA/IDEgOiAwO1xuICAgIHJldHVybiByLm1hcCgocm93LCBpKSA9PiB7XG4gICAgICByZXR1cm4gY29udmVydFJvd1RvT2JqZWN0KHJvdywgaGVhZGVycywgZmlyc3RMaW5lSW5kZXggKyBpKTtcbiAgICB9KSBhcyBQYXJzZVJlc3VsdDxQYXJzZU9wdGlvbnMsIFQ+O1xuICB9XG4gIHJldHVybiByIGFzIFBhcnNlUmVzdWx0PFBhcnNlT3B0aW9ucywgVD47XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFx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