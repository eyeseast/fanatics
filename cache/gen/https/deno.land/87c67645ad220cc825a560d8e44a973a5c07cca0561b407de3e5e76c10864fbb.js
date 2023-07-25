// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
const QUOTE = '"';
const LF = "\n";
const CRLF = "\r\n";
const BYTE_ORDER_MARK = "\ufeff";
function getEscapedString(value, sep) {
    if (value === undefined || value === null) return "";
    let str = "";
    if (typeof value === "object") str = JSON.stringify(value);
    else str = String(value);
    // Is regex.test more performant here? If so, how to dynamically create?
    // https://stackoverflow.com/questions/3561493/
    if (str.includes(sep) || str.includes(LF) || str.includes(QUOTE)) {
        return `${QUOTE}${str.replaceAll(QUOTE, `${QUOTE}${QUOTE}`)}${QUOTE}`;
    }
    return str;
}
function normalizeColumn(column) {
    let header, prop;
    if (typeof column === "object") {
        if (Array.isArray(column)) {
            header = String(column[column.length - 1]);
            prop = column;
        } else {
            prop = Array.isArray(column.prop) ? column.prop : [
                column.prop
            ];
            header = typeof column.header === "string" ? column.header : String(prop[prop.length - 1]);
        }
    } else {
        header = String(column);
        prop = [
            column
        ];
    }
    return {
        header,
        prop
    };
}
export class StringifyError extends Error {
    name = "StringifyError";
}
/**
 * Returns an array of values from an object using the property accessors
 * (and optional transform function) in each column
 */ function getValuesFromItem(item, normalizedColumns) {
    const values = [];
    if (normalizedColumns.length) {
        for (const column of normalizedColumns){
            let value = item;
            for (const prop of column.prop){
                if (typeof value !== "object" || value === null) continue;
                if (Array.isArray(value)) {
                    if (typeof prop === "number") value = value[prop];
                    else {
                        throw new StringifyError('Property accessor is not of type "number"');
                    }
                } else value = value[prop];
            }
            values.push(value);
        }
    } else {
        if (Array.isArray(item)) {
            values.push(...item);
        } else if (typeof item === "object") {
            throw new StringifyError("No property accessor function was provided for object");
        } else {
            values.push(item);
        }
    }
    return values;
}
/**
 * Write data using CSV encoding.
 *
 * @param data The source data to stringify. It's an array of items which are
 * plain objects or arrays.
 *
 * `DataItem: Record<string, unknown> | unknown[]`
 *
 * ```ts
 * const data = [
 *   {
 *     name: "Deno",
 *     repo: { org: "denoland", name: "deno" },
 *     runsOn: ["Rust", "TypeScript"],
 *   },
 * ];
 * ```
 *
 * @example
 * ```ts
 * import {
 *   Column,
 *   stringify,
 * } from "https://deno.land/std@$STD_VERSION/csv/stringify.ts";
 *
 * type Character = {
 *   age: number;
 *   name: {
 *     first: string;
 *     last: string;
 *   };
 * };
 *
 * const data: Character[] = [
 *   {
 *     age: 70,
 *     name: {
 *       first: "Rick",
 *       last: "Sanchez",
 *     },
 *   },
 *   {
 *     age: 14,
 *     name: {
 *       first: "Morty",
 *       last: "Smith",
 *     },
 *   },
 * ];
 *
 * let columns: Column[] = [
 *   ["name", "first"],
 *   "age",
 * ];
 *
 * console.log(stringify(data, { columns }));
 * // first,age
 * // Rick,70
 * // Morty,14
 * ```
 *
 * @param options Output formatting options
 */ export function stringify(data, { headers =true , separator: sep = "," , columns =[] , bom =false  } = {}) {
    if (sep.includes(QUOTE) || sep.includes(CRLF)) {
        const message = [
            "Separator cannot include the following strings:",
            '  - U+0022: Quotation mark (")',
            "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)"
        ].join("\n");
        throw new StringifyError(message);
    }
    const normalizedColumns = columns.map(normalizeColumn);
    let output = "";
    if (bom) {
        output += BYTE_ORDER_MARK;
    }
    if (headers) {
        output += normalizedColumns.map((column)=>getEscapedString(column.header, sep)).join(sep);
        output += CRLF;
    }
    for (const item of data){
        const values = getValuesFromItem(item, normalizedColumns);
        output += values.map((value)=>getEscapedString(value, sep)).join(sep);
        output += CRLF;
    }
    return output;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL2Nzdi9zdHJpbmdpZnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxudHlwZSBQcm9wZXJ0eUFjY2Vzc29yID0gbnVtYmVyIHwgc3RyaW5nO1xudHlwZSBPYmplY3RXaXRoU3RyaW5nUHJvcGVydHlLZXlzID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG5cbi8qKlxuICogQHBhcmFtIGhlYWRlciBFeHBsaWNpdCBjb2x1bW4gaGVhZGVyIG5hbWUuIElmIG9taXR0ZWQsXG4gKiB0aGUgKGZpbmFsKSBwcm9wZXJ0eSBhY2Nlc3NvciBpcyB1c2VkIGZvciB0aGlzIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBwcm9wIFByb3BlcnR5IGFjY2Vzc29yKHMpIHVzZWQgdG8gYWNjZXNzIHRoZSB2YWx1ZSBvbiB0aGUgb2JqZWN0XG4gKi9cbmV4cG9ydCB0eXBlIENvbHVtbkRldGFpbHMgPSB7XG4gIGhlYWRlcj86IHN0cmluZztcbiAgcHJvcDogUHJvcGVydHlBY2Nlc3NvciB8IFByb3BlcnR5QWNjZXNzb3JbXTtcbn07XG5cbi8qKlxuICogVGhlIG1vc3QgZXNzZW50aWFsIGFzcGVjdCBvZiBhIGNvbHVtbiBpcyBhY2Nlc3NpbmcgdGhlIHByb3BlcnR5IGhvbGRpbmcgdGhlXG4gKiBkYXRhIGZvciB0aGF0IGNvbHVtbiBvbiBlYWNoIG9iamVjdCBpbiB0aGUgZGF0YSBhcnJheS4gSWYgdGhhdCBtZW1iZXIgaXMgYXRcbiAqIHRoZSB0b3AgbGV2ZWwsIGBDb2x1bW5gIGNhbiBzaW1wbHkgYmUgYSBwcm9wZXJ0eSBhY2Nlc3Nvciwgd2hpY2ggaXMgZWl0aGVyIGFcbiAqIGBzdHJpbmdgIChpZiBpdCdzIGEgcGxhaW4gb2JqZWN0KSBvciBhIGBudW1iZXJgIChpZiBpdCdzIGFuIGFycmF5KS5cbiAqXG4gKiBgYGB0c1xuICogY29uc3QgY29sdW1ucyA9IFtcbiAqICAgXCJuYW1lXCIsXG4gKiBdO1xuICogYGBgXG4gKlxuICogRWFjaCBwcm9wZXJ0eSBhY2Nlc3NvciB3aWxsIGJlIHVzZWQgYXMgdGhlIGhlYWRlciBmb3IgdGhlIGNvbHVtbjpcbiAqXG4gKiB8IG5hbWUgfFxuICogfCA6LS06IHxcbiAqIHwgRGVubyB8XG4gKlxuICogLSBJZiB0aGUgcmVxdWlyZWQgZGF0YSBpcyBub3QgYXQgdGhlIHRvcCBsZXZlbCAoaXQncyBuZXN0ZWQgaW4gb3RoZXJcbiAqICAgb2JqZWN0cy9hcnJheXMpLCB0aGVuIGEgc2ltcGxlIHByb3BlcnR5IGFjY2Vzc29yIHdvbid0IHdvcmssIHNvIGFuIGFycmF5IG9mXG4gKiAgIHRoZW0gd2lsbCBiZSByZXF1aXJlZC5cbiAqXG4gKiAgIGBgYHRzXG4gKiAgIGNvbnN0IGNvbHVtbnMgPSBbXG4gKiAgICAgW1wicmVwb1wiLCBcIm5hbWVcIl0sXG4gKiAgICAgW1wicmVwb1wiLCBcIm9yZ1wiXSxcbiAqICAgXTtcbiAqICAgYGBgXG4gKlxuICogICBXaGVuIHVzaW5nIGFycmF5cyBvZiBwcm9wZXJ0eSBhY2Nlc3NvcnMsIHRoZSBoZWFkZXIgbmFtZXMgaW5oZXJpdCB0aGUgdmFsdWVcbiAqICAgb2YgdGhlIGxhc3QgYWNjZXNzb3IgaW4gZWFjaCBhcnJheTpcbiAqXG4gKiAgIHwgbmFtZSB8ICAgb3JnICAgIHxcbiAqICAgfCA6LS06IHwgOi0tLS0tLTogfFxuICogICB8IGRlbm8gfCBkZW5vbGFuZCB8XG4gKlxuICogIC0gSWYgYSBkaWZmZXJlbnQgY29sdW1uIGhlYWRlciBpcyBkZXNpcmVkLCB0aGVuIGEgYENvbHVtbkRldGFpbHNgIG9iamVjdCB0eXBlXG4gKiAgICAgY2FuIGJlIHVzZWQgZm9yIGVhY2ggY29sdW1uOlxuICpcbiAqICAgLSAqKmBoZWFkZXI/OiBzdHJpbmdgKiogaXMgdGhlIG9wdGlvbmFsIHZhbHVlIHRvIHVzZSBmb3IgdGhlIGNvbHVtbiBoZWFkZXJcbiAqICAgICBuYW1lXG4gKlxuICogICAtICoqYHByb3A6IFByb3BlcnR5QWNjZXNzb3IgfCBQcm9wZXJ0eUFjY2Vzc29yW11gKiogaXMgdGhlIHByb3BlcnR5IGFjY2Vzc29yXG4gKiAgICAgKGBzdHJpbmdgIG9yIGBudW1iZXJgKSBvciBhcnJheSBvZiBwcm9wZXJ0eSBhY2Nlc3NvcnMgdXNlZCB0byBhY2Nlc3MgdGhlXG4gKiAgICAgZGF0YSBvbiBlYWNoIG9iamVjdFxuICpcbiAqICAgYGBgdHNcbiAqICAgY29uc3QgY29sdW1ucyA9IFtcbiAqICAgICBcIm5hbWVcIixcbiAqICAgICB7XG4gKiAgICAgICBwcm9wOiBbXCJydW5zT25cIiwgMF0sXG4gKiAgICAgICBoZWFkZXI6IFwibGFuZ3VhZ2UgMVwiLFxuICogICAgIH0sXG4gKiAgICAge1xuICogICAgICAgcHJvcDogW1wicnVuc09uXCIsIDFdLFxuICogICAgICAgaGVhZGVyOiBcImxhbmd1YWdlIDJcIixcbiAqICAgICB9LFxuICogICBdO1xuICogICBgYGBcbiAqXG4gKiAgIHwgbmFtZSB8IGxhbmd1YWdlIDEgfCBsYW5ndWFnZSAyIHxcbiAqICAgfCA6LS06IHwgOi0tLS0tLS0tOiB8IDotLS0tLS0tLTogfFxuICogICB8IERlbm8gfCAgICBSdXN0ICAgIHwgVHlwZVNjcmlwdCB8XG4gKi9cbmV4cG9ydCB0eXBlIENvbHVtbiA9IENvbHVtbkRldGFpbHMgfCBQcm9wZXJ0eUFjY2Vzc29yIHwgUHJvcGVydHlBY2Nlc3NvcltdO1xuXG4vKiogQW4gb2JqZWN0IChwbGFpbiBvciBhcnJheSkgKi9cbmV4cG9ydCB0eXBlIERhdGFJdGVtID0gT2JqZWN0V2l0aFN0cmluZ1Byb3BlcnR5S2V5cyB8IHVua25vd25bXTtcblxuZXhwb3J0IHR5cGUgU3RyaW5naWZ5T3B0aW9ucyA9IHtcbiAgLyoqIFdoZXRoZXIgdG8gaW5jbHVkZSB0aGUgcm93IG9mIGhlYWRlcnMgb3Igbm90LlxuICAgKlxuICAgKiBAZGVmYXVsdCB7dHJ1ZX1cbiAgICovXG4gIGhlYWRlcnM/OiBib29sZWFuO1xuICAvKipcbiAgICogRGVsaW1pdGVyIHVzZWQgdG8gc2VwYXJhdGUgdmFsdWVzLiBFeGFtcGxlczpcbiAgICogIC0gYFwiLFwiYCBfY29tbWFfXG4gICAqICAtIGBcIlxcdFwiYCBfdGFiX1xuICAgKiAgLSBgXCJ8XCJgIF9waXBlX1xuICAgKiAgLSBldGMuXG4gICAqXG4gICAqICBAZGVmYXVsdCB7XCIsXCJ9XG4gICAqL1xuICBzZXBhcmF0b3I/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIGZvciBob3cgdG8gdGFyZ2V0IGFuZCB0cmFuc2Zvcm0gdGhlIGRhdGEgZm9yIGVhY2hcbiAgICogY29sdW1uIG9mIG91dHB1dC4gVGhpcyBpcyBhbHNvIHdoZXJlIHlvdSBjYW4gcHJvdmlkZSBhbiBleHBsaWNpdCBoZWFkZXJcbiAgICogbmFtZSBmb3IgdGhlIGNvbHVtbi5cbiAgICovXG4gIGNvbHVtbnM/OiBDb2x1bW5bXTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gYWRkIGFcbiAgICogW2J5dGUtb3JkZXIgbWFya10oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQnl0ZV9vcmRlcl9tYXJrKSB0byB0aGVcbiAgICogYmVnaW5uaW5nIG9mIHRoZSBmaWxlIGNvbnRlbnQuIFJlcXVpcmVkIGJ5IHNvZnR3YXJlIHN1Y2ggYXMgTVMgRXhjZWwgdG9cbiAgICogcHJvcGVybHkgZGlzcGxheSBVbmljb2RlIHRleHQuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIGJvbT86IGJvb2xlYW47XG59O1xuXG5jb25zdCBRVU9URSA9ICdcIic7XG5jb25zdCBMRiA9IFwiXFxuXCI7XG5jb25zdCBDUkxGID0gXCJcXHJcXG5cIjtcbmNvbnN0IEJZVEVfT1JERVJfTUFSSyA9IFwiXFx1ZmVmZlwiO1xuXG5mdW5jdGlvbiBnZXRFc2NhcGVkU3RyaW5nKHZhbHVlOiB1bmtub3duLCBzZXA6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJcIjtcbiAgbGV0IHN0ciA9IFwiXCI7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikgc3RyID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICBlbHNlIHN0ciA9IFN0cmluZyh2YWx1ZSk7XG5cbiAgLy8gSXMgcmVnZXgudGVzdCBtb3JlIHBlcmZvcm1hbnQgaGVyZT8gSWYgc28sIGhvdyB0byBkeW5hbWljYWxseSBjcmVhdGU/XG4gIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NjE0OTMvXG4gIGlmIChzdHIuaW5jbHVkZXMoc2VwKSB8fCBzdHIuaW5jbHVkZXMoTEYpIHx8IHN0ci5pbmNsdWRlcyhRVU9URSkpIHtcbiAgICByZXR1cm4gYCR7UVVPVEV9JHtzdHIucmVwbGFjZUFsbChRVU9URSwgYCR7UVVPVEV9JHtRVU9URX1gKX0ke1FVT1RFfWA7XG4gIH1cblxuICByZXR1cm4gc3RyO1xufVxuXG50eXBlIE5vcm1hbGl6ZWRDb2x1bW4gPSBPbWl0PENvbHVtbkRldGFpbHMsIFwiaGVhZGVyXCIgfCBcInByb3BcIj4gJiB7XG4gIGhlYWRlcjogc3RyaW5nO1xuICBwcm9wOiBQcm9wZXJ0eUFjY2Vzc29yW107XG59O1xuXG5mdW5jdGlvbiBub3JtYWxpemVDb2x1bW4oY29sdW1uOiBDb2x1bW4pOiBOb3JtYWxpemVkQ29sdW1uIHtcbiAgbGV0IGhlYWRlcjogTm9ybWFsaXplZENvbHVtbltcImhlYWRlclwiXSxcbiAgICBwcm9wOiBOb3JtYWxpemVkQ29sdW1uW1wicHJvcFwiXTtcblxuICBpZiAodHlwZW9mIGNvbHVtbiA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNvbHVtbikpIHtcbiAgICAgIGhlYWRlciA9IFN0cmluZyhjb2x1bW5bY29sdW1uLmxlbmd0aCAtIDFdKTtcbiAgICAgIHByb3AgPSBjb2x1bW47XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3AgPSBBcnJheS5pc0FycmF5KGNvbHVtbi5wcm9wKSA/IGNvbHVtbi5wcm9wIDogW2NvbHVtbi5wcm9wXTtcbiAgICAgIGhlYWRlciA9IHR5cGVvZiBjb2x1bW4uaGVhZGVyID09PSBcInN0cmluZ1wiXG4gICAgICAgID8gY29sdW1uLmhlYWRlclxuICAgICAgICA6IFN0cmluZyhwcm9wW3Byb3AubGVuZ3RoIC0gMV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBoZWFkZXIgPSBTdHJpbmcoY29sdW1uKTtcbiAgICBwcm9wID0gW2NvbHVtbl07XG4gIH1cblxuICByZXR1cm4geyBoZWFkZXIsIHByb3AgfTtcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ2lmeUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBvdmVycmlkZSByZWFkb25seSBuYW1lID0gXCJTdHJpbmdpZnlFcnJvclwiO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgdmFsdWVzIGZyb20gYW4gb2JqZWN0IHVzaW5nIHRoZSBwcm9wZXJ0eSBhY2Nlc3NvcnNcbiAqIChhbmQgb3B0aW9uYWwgdHJhbnNmb3JtIGZ1bmN0aW9uKSBpbiBlYWNoIGNvbHVtblxuICovXG5mdW5jdGlvbiBnZXRWYWx1ZXNGcm9tSXRlbShcbiAgaXRlbTogRGF0YUl0ZW0sXG4gIG5vcm1hbGl6ZWRDb2x1bW5zOiBOb3JtYWxpemVkQ29sdW1uW10sXG4pOiB1bmtub3duW10ge1xuICBjb25zdCB2YWx1ZXM6IHVua25vd25bXSA9IFtdO1xuXG4gIGlmIChub3JtYWxpemVkQ29sdW1ucy5sZW5ndGgpIHtcbiAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiBub3JtYWxpemVkQ29sdW1ucykge1xuICAgICAgbGV0IHZhbHVlOiB1bmtub3duID0gaXRlbTtcblxuICAgICAgZm9yIChjb25zdCBwcm9wIG9mIGNvbHVtbi5wcm9wKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgfHwgdmFsdWUgPT09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHByb3AgPT09IFwibnVtYmVyXCIpIHZhbHVlID0gdmFsdWVbcHJvcF07XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgU3RyaW5naWZ5RXJyb3IoXG4gICAgICAgICAgICAgICdQcm9wZXJ0eSBhY2Nlc3NvciBpcyBub3Qgb2YgdHlwZSBcIm51bWJlclwiJyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IC8vIEkgdGhpbmsgdGhpcyBhc3NlcnRpb24gaXMgc2FmZS4gQ29uZmlybT9cbiAgICAgICAgZWxzZSB2YWx1ZSA9ICh2YWx1ZSBhcyBPYmplY3RXaXRoU3RyaW5nUHJvcGVydHlLZXlzKVtwcm9wXTtcbiAgICAgIH1cblxuICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgdmFsdWVzLnB1c2goLi4uaXRlbSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaXRlbSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgdGhyb3cgbmV3IFN0cmluZ2lmeUVycm9yKFxuICAgICAgICBcIk5vIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9uIHdhcyBwcm92aWRlZCBmb3Igb2JqZWN0XCIsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZXMucHVzaChpdGVtKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdmFsdWVzO1xufVxuXG4vKipcbiAqIFdyaXRlIGRhdGEgdXNpbmcgQ1NWIGVuY29kaW5nLlxuICpcbiAqIEBwYXJhbSBkYXRhIFRoZSBzb3VyY2UgZGF0YSB0byBzdHJpbmdpZnkuIEl0J3MgYW4gYXJyYXkgb2YgaXRlbXMgd2hpY2ggYXJlXG4gKiBwbGFpbiBvYmplY3RzIG9yIGFycmF5cy5cbiAqXG4gKiBgRGF0YUl0ZW06IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5rbm93bltdYFxuICpcbiAqIGBgYHRzXG4gKiBjb25zdCBkYXRhID0gW1xuICogICB7XG4gKiAgICAgbmFtZTogXCJEZW5vXCIsXG4gKiAgICAgcmVwbzogeyBvcmc6IFwiZGVub2xhbmRcIiwgbmFtZTogXCJkZW5vXCIgfSxcbiAqICAgICBydW5zT246IFtcIlJ1c3RcIiwgXCJUeXBlU2NyaXB0XCJdLFxuICogICB9LFxuICogXTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgQ29sdW1uLFxuICogICBzdHJpbmdpZnksXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2Nzdi9zdHJpbmdpZnkudHNcIjtcbiAqXG4gKiB0eXBlIENoYXJhY3RlciA9IHtcbiAqICAgYWdlOiBudW1iZXI7XG4gKiAgIG5hbWU6IHtcbiAqICAgICBmaXJzdDogc3RyaW5nO1xuICogICAgIGxhc3Q6IHN0cmluZztcbiAqICAgfTtcbiAqIH07XG4gKlxuICogY29uc3QgZGF0YTogQ2hhcmFjdGVyW10gPSBbXG4gKiAgIHtcbiAqICAgICBhZ2U6IDcwLFxuICogICAgIG5hbWU6IHtcbiAqICAgICAgIGZpcnN0OiBcIlJpY2tcIixcbiAqICAgICAgIGxhc3Q6IFwiU2FuY2hlelwiLFxuICogICAgIH0sXG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBhZ2U6IDE0LFxuICogICAgIG5hbWU6IHtcbiAqICAgICAgIGZpcnN0OiBcIk1vcnR5XCIsXG4gKiAgICAgICBsYXN0OiBcIlNtaXRoXCIsXG4gKiAgICAgfSxcbiAqICAgfSxcbiAqIF07XG4gKlxuICogbGV0IGNvbHVtbnM6IENvbHVtbltdID0gW1xuICogICBbXCJuYW1lXCIsIFwiZmlyc3RcIl0sXG4gKiAgIFwiYWdlXCIsXG4gKiBdO1xuICpcbiAqIGNvbnNvbGUubG9nKHN0cmluZ2lmeShkYXRhLCB7IGNvbHVtbnMgfSkpO1xuICogLy8gZmlyc3QsYWdlXG4gKiAvLyBSaWNrLDcwXG4gKiAvLyBNb3J0eSwxNFxuICogYGBgXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgT3V0cHV0IGZvcm1hdHRpbmcgb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5KFxuICBkYXRhOiBEYXRhSXRlbVtdLFxuICB7IGhlYWRlcnMgPSB0cnVlLCBzZXBhcmF0b3I6IHNlcCA9IFwiLFwiLCBjb2x1bW5zID0gW10sIGJvbSA9IGZhbHNlIH06XG4gICAgU3RyaW5naWZ5T3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgaWYgKHNlcC5pbmNsdWRlcyhRVU9URSkgfHwgc2VwLmluY2x1ZGVzKENSTEYpKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IFtcbiAgICAgIFwiU2VwYXJhdG9yIGNhbm5vdCBpbmNsdWRlIHRoZSBmb2xsb3dpbmcgc3RyaW5nczpcIixcbiAgICAgICcgIC0gVSswMDIyOiBRdW90YXRpb24gbWFyayAoXCIpJyxcbiAgICAgIFwiICAtIFUrMDAwRCBVKzAwMEE6IENhcnJpYWdlIFJldHVybiArIExpbmUgRmVlZCAoXFxcXHJcXFxcbilcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gICAgdGhyb3cgbmV3IFN0cmluZ2lmeUVycm9yKG1lc3NhZ2UpO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZENvbHVtbnMgPSBjb2x1bW5zLm1hcChub3JtYWxpemVDb2x1bW4pO1xuICBsZXQgb3V0cHV0ID0gXCJcIjtcblxuICBpZiAoYm9tKSB7XG4gICAgb3V0cHV0ICs9IEJZVEVfT1JERVJfTUFSSztcbiAgfVxuXG4gIGlmIChoZWFkZXJzKSB7XG4gICAgb3V0cHV0ICs9IG5vcm1hbGl6ZWRDb2x1bW5zXG4gICAgICAubWFwKChjb2x1bW4pID0+IGdldEVzY2FwZWRTdHJpbmcoY29sdW1uLmhlYWRlciwgc2VwKSlcbiAgICAgIC5qb2luKHNlcCk7XG4gICAgb3V0cHV0ICs9IENSTEY7XG4gIH1cblxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgIGNvbnN0IHZhbHVlcyA9IGdldFZhbHVlc0Zyb21JdGVtKGl0ZW0sIG5vcm1hbGl6ZWRDb2x1bW5zKTtcbiAgICBvdXRwdXQgKz0gdmFsdWVzXG4gICAgICAubWFwKCh2YWx1ZSkgPT4gZ2V0RXNjYXBlZFN0cmluZyh2YWx1ZSwgc2VwKSlcbiAgICAgIC5qb2luKHNlcCk7XG4gICAgb3V0cHV0ICs9IENSTEY7XG4gIH1cblxuICByZXR1cm4gb3V0cHV0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFzSHJDLE1BQU0sUUFBUTtBQUNkLE1BQU0sS0FBSztBQUNYLE1BQU0sT0FBTztBQUNiLE1BQU0sa0JBQWtCO0FBRXhCLFNBQVMsaUJBQWlCLEtBQWMsRUFBRSxHQUFXO0lBQ25ELElBQUksVUFBVSxhQUFhLFVBQVUsTUFBTSxPQUFPO0lBQ2xELElBQUksTUFBTTtJQUVWLElBQUksT0FBTyxVQUFVLFVBQVUsTUFBTSxLQUFLLFVBQVU7U0FDL0MsTUFBTSxPQUFPO0lBRWxCLHdFQUF3RTtJQUN4RSwrQ0FBK0M7SUFDL0MsSUFBSSxJQUFJLFNBQVMsUUFBUSxJQUFJLFNBQVMsT0FBTyxJQUFJLFNBQVMsUUFBUTtRQUNoRSxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxXQUFXLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN2RTtJQUVBLE9BQU87QUFDVDtBQU9BLFNBQVMsZ0JBQWdCLE1BQWM7SUFDckMsSUFBSSxRQUNGO0lBRUYsSUFBSSxPQUFPLFdBQVcsVUFBVTtRQUM5QixJQUFJLE1BQU0sUUFBUSxTQUFTO1lBQ3pCLFNBQVMsT0FBTyxNQUFNLENBQUMsT0FBTyxTQUFTLEVBQUU7WUFDekMsT0FBTztRQUNULE9BQU87WUFDTCxPQUFPLE1BQU0sUUFBUSxPQUFPLFFBQVEsT0FBTyxPQUFPO2dCQUFDLE9BQU87YUFBSztZQUMvRCxTQUFTLE9BQU8sT0FBTyxXQUFXLFdBQzlCLE9BQU8sU0FDUCxPQUFPLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtRQUNsQztJQUNGLE9BQU87UUFDTCxTQUFTLE9BQU87UUFDaEIsT0FBTztZQUFDO1NBQU87SUFDakI7SUFFQSxPQUFPO1FBQUU7UUFBUTtJQUFLO0FBQ3hCO0FBRUEsT0FBTyxNQUFNLHVCQUF1QjtJQUNoQixPQUFPLGlCQUFpQjtBQUM1QztBQUVBOzs7Q0FHQyxHQUNELFNBQVMsa0JBQ1AsSUFBYyxFQUNkLGlCQUFxQztJQUVyQyxNQUFNLFNBQW9CLEVBQUU7SUFFNUIsSUFBSSxrQkFBa0IsUUFBUTtRQUM1QixLQUFLLE1BQU0sVUFBVSxrQkFBbUI7WUFDdEMsSUFBSSxRQUFpQjtZQUVyQixLQUFLLE1BQU0sUUFBUSxPQUFPLEtBQU07Z0JBQzlCLElBQUksT0FBTyxVQUFVLFlBQVksVUFBVSxNQUFNO2dCQUNqRCxJQUFJLE1BQU0sUUFBUSxRQUFRO29CQUN4QixJQUFJLE9BQU8sU0FBUyxVQUFVLFFBQVEsS0FBSyxDQUFDLEtBQUs7eUJBQzVDO3dCQUNILE1BQU0sSUFBSSxlQUNSO29CQUVKO2dCQUNGLE9BQ0ssUUFBUSxBQUFDLEtBQXNDLENBQUMsS0FBSztZQUM1RDtZQUVBLE9BQU8sS0FBSztRQUNkO0lBQ0YsT0FBTztRQUNMLElBQUksTUFBTSxRQUFRLE9BQU87WUFDdkIsT0FBTyxRQUFRO1FBQ2pCLE9BQU8sSUFBSSxPQUFPLFNBQVMsVUFBVTtZQUNuQyxNQUFNLElBQUksZUFDUjtRQUVKLE9BQU87WUFDTCxPQUFPLEtBQUs7UUFDZDtJQUNGO0lBRUEsT0FBTztBQUNUO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOERDLEdBQ0QsT0FBTyxTQUFTLFVBQ2QsSUFBZ0IsRUFDaEIsRUFBRSxTQUFVLEtBQUksRUFBRSxXQUFXLE1BQU0sR0FBRyxDQUFBLEVBQUUsU0FBVSxFQUFFLENBQUEsRUFBRSxLQUFNLE1BQUssRUFDL0MsR0FBRyxDQUFDLENBQUM7SUFFdkIsSUFBSSxJQUFJLFNBQVMsVUFBVSxJQUFJLFNBQVMsT0FBTztRQUM3QyxNQUFNLFVBQVU7WUFDZDtZQUNBO1lBQ0E7U0FDRCxDQUFDLEtBQUs7UUFDUCxNQUFNLElBQUksZUFBZTtJQUMzQjtJQUVBLE1BQU0sb0JBQW9CLFFBQVEsSUFBSTtJQUN0QyxJQUFJLFNBQVM7SUFFYixJQUFJLEtBQUs7UUFDUCxVQUFVO0lBQ1o7SUFFQSxJQUFJLFNBQVM7UUFDWCxVQUFVLGtCQUNQLElBQUksQ0FBQyxTQUFXLGlCQUFpQixPQUFPLFFBQVEsTUFDaEQsS0FBSztRQUNSLFVBQVU7SUFDWjtJQUVBLEtBQUssTUFBTSxRQUFRLEtBQU07UUFDdkIsTUFBTSxTQUFTLGtCQUFrQixNQUFNO1FBQ3ZDLFVBQVUsT0FDUCxJQUFJLENBQUMsUUFBVSxpQkFBaUIsT0FBTyxNQUN2QyxLQUFLO1FBQ1IsVUFBVTtJQUNaO0lBRUEsT0FBTztBQUNUIn0=