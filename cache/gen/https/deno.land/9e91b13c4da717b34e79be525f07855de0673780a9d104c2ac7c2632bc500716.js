// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Reads and writes comma-separated values (CSV) files.
 *
 * There are many kinds of CSV files; this module supports the format described
 * in [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180.html).
 *
 * A csv file contains zero or more records of one or more fields per record.
 * Each record is separated by the newline character. The final record may
 * optionally be followed by a newline character.
 *
 * ```csv
 * field1,field2,field3
 * ```
 *
 * White space is considered part of a field.
 *
 * Carriage returns before newline characters are silently removed.
 *
 * Blank lines are ignored. A line with only whitespace characters (excluding
 * the ending newline character) is not considered a blank line.
 *
 * Fields which start and stop with the quote character " are called
 * quoted-fields. The beginning and ending quote are not part of the field.
 *
 * The source:
 *
 * ```csv
 * normal string,"quoted-field"
 * ```
 *
 * results in the fields
 *
 * ```ts
 * [`normal string`, `quoted-field`]
 * ```
 *
 * Within a quoted-field a quote character followed by a second quote character is considered a single quote.
 *
 * ```csv
 * "the ""word"" is true","a ""quoted-field"""
 * ```
 *
 * results in
 *
 * [`the "word" is true`, `a "quoted-field"`]
 *
 * Newlines and commas may be included in a quoted-field
 *
 * ```csv
 * "Multi-line
 * field","comma is ,"
 * ```
 *
 * results in
 *
 * ```ts
 * [`Multi-line
 * field`, `comma is ,`]
 * ```
 *
 * @module
 */ export * from "./stringify.ts";
export * from "./parse.ts";
export * from "./csv_parse_stream.ts";
export * from "./csv_stringify_stream.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL2Nzdi9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqIFJlYWRzIGFuZCB3cml0ZXMgY29tbWEtc2VwYXJhdGVkIHZhbHVlcyAoQ1NWKSBmaWxlcy5cbiAqXG4gKiBUaGVyZSBhcmUgbWFueSBraW5kcyBvZiBDU1YgZmlsZXM7IHRoaXMgbW9kdWxlIHN1cHBvcnRzIHRoZSBmb3JtYXQgZGVzY3JpYmVkXG4gKiBpbiBbUkZDIDQxODBdKGh0dHBzOi8vd3d3LnJmYy1lZGl0b3Iub3JnL3JmYy9yZmM0MTgwLmh0bWwpLlxuICpcbiAqIEEgY3N2IGZpbGUgY29udGFpbnMgemVybyBvciBtb3JlIHJlY29yZHMgb2Ygb25lIG9yIG1vcmUgZmllbGRzIHBlciByZWNvcmQuXG4gKiBFYWNoIHJlY29yZCBpcyBzZXBhcmF0ZWQgYnkgdGhlIG5ld2xpbmUgY2hhcmFjdGVyLiBUaGUgZmluYWwgcmVjb3JkIG1heVxuICogb3B0aW9uYWxseSBiZSBmb2xsb3dlZCBieSBhIG5ld2xpbmUgY2hhcmFjdGVyLlxuICpcbiAqIGBgYGNzdlxuICogZmllbGQxLGZpZWxkMixmaWVsZDNcbiAqIGBgYFxuICpcbiAqIFdoaXRlIHNwYWNlIGlzIGNvbnNpZGVyZWQgcGFydCBvZiBhIGZpZWxkLlxuICpcbiAqIENhcnJpYWdlIHJldHVybnMgYmVmb3JlIG5ld2xpbmUgY2hhcmFjdGVycyBhcmUgc2lsZW50bHkgcmVtb3ZlZC5cbiAqXG4gKiBCbGFuayBsaW5lcyBhcmUgaWdub3JlZC4gQSBsaW5lIHdpdGggb25seSB3aGl0ZXNwYWNlIGNoYXJhY3RlcnMgKGV4Y2x1ZGluZ1xuICogdGhlIGVuZGluZyBuZXdsaW5lIGNoYXJhY3RlcikgaXMgbm90IGNvbnNpZGVyZWQgYSBibGFuayBsaW5lLlxuICpcbiAqIEZpZWxkcyB3aGljaCBzdGFydCBhbmQgc3RvcCB3aXRoIHRoZSBxdW90ZSBjaGFyYWN0ZXIgXCIgYXJlIGNhbGxlZFxuICogcXVvdGVkLWZpZWxkcy4gVGhlIGJlZ2lubmluZyBhbmQgZW5kaW5nIHF1b3RlIGFyZSBub3QgcGFydCBvZiB0aGUgZmllbGQuXG4gKlxuICogVGhlIHNvdXJjZTpcbiAqXG4gKiBgYGBjc3ZcbiAqIG5vcm1hbCBzdHJpbmcsXCJxdW90ZWQtZmllbGRcIlxuICogYGBgXG4gKlxuICogcmVzdWx0cyBpbiB0aGUgZmllbGRzXG4gKlxuICogYGBgdHNcbiAqIFtgbm9ybWFsIHN0cmluZ2AsIGBxdW90ZWQtZmllbGRgXVxuICogYGBgXG4gKlxuICogV2l0aGluIGEgcXVvdGVkLWZpZWxkIGEgcXVvdGUgY2hhcmFjdGVyIGZvbGxvd2VkIGJ5IGEgc2Vjb25kIHF1b3RlIGNoYXJhY3RlciBpcyBjb25zaWRlcmVkIGEgc2luZ2xlIHF1b3RlLlxuICpcbiAqIGBgYGNzdlxuICogXCJ0aGUgXCJcIndvcmRcIlwiIGlzIHRydWVcIixcImEgXCJcInF1b3RlZC1maWVsZFwiXCJcIlxuICogYGBgXG4gKlxuICogcmVzdWx0cyBpblxuICpcbiAqIFtgdGhlIFwid29yZFwiIGlzIHRydWVgLCBgYSBcInF1b3RlZC1maWVsZFwiYF1cbiAqXG4gKiBOZXdsaW5lcyBhbmQgY29tbWFzIG1heSBiZSBpbmNsdWRlZCBpbiBhIHF1b3RlZC1maWVsZFxuICpcbiAqIGBgYGNzdlxuICogXCJNdWx0aS1saW5lXG4gKiBmaWVsZFwiLFwiY29tbWEgaXMgLFwiXG4gKiBgYGBcbiAqXG4gKiByZXN1bHRzIGluXG4gKlxuICogYGBgdHNcbiAqIFtgTXVsdGktbGluZVxuICogZmllbGRgLCBgY29tbWEgaXMgLGBdXG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuZXhwb3J0ICogZnJvbSBcIi4vc3RyaW5naWZ5LnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9wYXJzZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY3N2X3BhcnNlX3N0cmVhbS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY3N2X3N0cmluZ2lmeV9zdHJlYW0udHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0REMsR0FFRCxjQUFjLGlCQUFpQjtBQUMvQixjQUFjLGFBQWE7QUFDM0IsY0FBYyx3QkFBd0I7QUFDdEMsY0FBYyw0QkFBNEIifQ==