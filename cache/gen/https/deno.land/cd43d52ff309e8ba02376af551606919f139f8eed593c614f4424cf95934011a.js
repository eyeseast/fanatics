// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { stringify } from "./stringify.ts";
/**
 * Convert each chunk to a CSV record.
 *
 * @example
 * ```ts
 * import { CsvStringifyStream } from "https://deno.land/std@$STD_VERSION/csv/csv_stringify_stream.ts";
 *
 * const file = await Deno.open("data.csv", { create: true, write: true });
 * const readable = ReadableStream.from([
 *   { id: 1, name: "one" },
 *   { id: 2, name: "two" },
 *   { id: 3, name: "three" },
 * ]);
 *
 * await readable
 *   .pipeThrough(new CsvStringifyStream({ columns: ["id", "name"] }))
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(file.writable);
 * ````
 */ export class CsvStringifyStream extends TransformStream {
    constructor(options){
        const { separator , columns =[]  } = options ?? {};
        super({
            start (controller) {
                if (columns && columns.length > 0) {
                    try {
                        controller.enqueue(stringify([
                            columns
                        ], {
                            separator,
                            headers: false
                        }));
                    } catch (error) {
                        controller.error(error);
                    }
                }
            },
            transform (chunk, controller) {
                try {
                    controller.enqueue(stringify([
                        chunk
                    ], {
                        separator,
                        headers: false,
                        columns
                    }));
                } catch (error) {
                    controller.error(error);
                }
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5NS4wL2Nzdi9jc3Zfc3RyaW5naWZ5X3N0cmVhbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgc3RyaW5naWZ5IH0gZnJvbSBcIi4vc3RyaW5naWZ5LnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3N2U3RyaW5naWZ5U3RyZWFtT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBEZWxpbWl0ZXIgdXNlZCB0byBzZXBhcmF0ZSB2YWx1ZXMuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtcIixcIn1cbiAgICovXG4gIHJlYWRvbmx5IHNlcGFyYXRvcj86IHN0cmluZztcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGNvbHVtbnMgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIG91dHB1dC5cbiAgICpcbiAgICogSWYgeW91IHdhbnQgdG8gc3RyZWFtIG9iamVjdHMsIHRoaXMgb3B0aW9uIGlzIHJlcXVpcmVkLlxuICAgKi9cbiAgcmVhZG9ubHkgY29sdW1ucz86IEFycmF5PHN0cmluZz47XG59XG5cbi8qKlxuICogQ29udmVydCBlYWNoIGNodW5rIHRvIGEgQ1NWIHJlY29yZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IENzdlN0cmluZ2lmeVN0cmVhbSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2Nzdi9jc3Zfc3RyaW5naWZ5X3N0cmVhbS50c1wiO1xuICpcbiAqIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oXCJkYXRhLmNzdlwiLCB7IGNyZWF0ZTogdHJ1ZSwgd3JpdGU6IHRydWUgfSk7XG4gKiBjb25zdCByZWFkYWJsZSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1xuICogICB7IGlkOiAxLCBuYW1lOiBcIm9uZVwiIH0sXG4gKiAgIHsgaWQ6IDIsIG5hbWU6IFwidHdvXCIgfSxcbiAqICAgeyBpZDogMywgbmFtZTogXCJ0aHJlZVwiIH0sXG4gKiBdKTtcbiAqXG4gKiBhd2FpdCByZWFkYWJsZVxuICogICAucGlwZVRocm91Z2gobmV3IENzdlN0cmluZ2lmeVN0cmVhbSh7IGNvbHVtbnM6IFtcImlkXCIsIFwibmFtZVwiXSB9KSlcbiAqICAgLnBpcGVUaHJvdWdoKG5ldyBUZXh0RW5jb2RlclN0cmVhbSgpKVxuICogICAucGlwZVRvKGZpbGUud3JpdGFibGUpO1xuICogYGBgYFxuICovXG5leHBvcnQgY2xhc3MgQ3N2U3RyaW5naWZ5U3RyZWFtPFRPcHRpb25zIGV4dGVuZHMgQ3N2U3RyaW5naWZ5U3RyZWFtT3B0aW9ucz5cbiAgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJlYW08XG4gICAgVE9wdGlvbnNbXCJjb2x1bW5zXCJdIGV4dGVuZHMgQXJyYXk8c3RyaW5nPiA/IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICAgICA6IEFycmF5PHVua25vd24+LFxuICAgIHN0cmluZ1xuICA+IHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IFRPcHRpb25zKSB7XG4gICAgY29uc3Qge1xuICAgICAgc2VwYXJhdG9yLFxuICAgICAgY29sdW1ucyA9IFtdLFxuICAgIH0gPSBvcHRpb25zID8/IHt9O1xuXG4gICAgc3VwZXIoXG4gICAgICB7XG4gICAgICAgIHN0YXJ0KGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICBpZiAoY29sdW1ucyAmJiBjb2x1bW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW2NvbHVtbnNdLCB7IHNlcGFyYXRvciwgaGVhZGVyczogZmFsc2UgfSksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZm9ybShjaHVuaywgY29udHJvbGxlcikge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShbY2h1bmtdLCB7IHNlcGFyYXRvciwgaGVhZGVyczogZmFsc2UsIGNvbHVtbnMgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsU0FBUyxTQUFTLFFBQVEsaUJBQWlCO0FBa0IzQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sTUFBTSwyQkFDSDtJQUtSLFlBQVksT0FBa0IsQ0FBRTtRQUM5QixNQUFNLEVBQ0osVUFBUyxFQUNULFNBQVUsRUFBRSxDQUFBLEVBQ2IsR0FBRyxXQUFXLENBQUM7UUFFaEIsS0FBSyxDQUNIO1lBQ0UsT0FBTSxVQUFVO2dCQUNkLElBQUksV0FBVyxRQUFRLFNBQVMsR0FBRztvQkFDakMsSUFBSTt3QkFDRixXQUFXLFFBQ1QsVUFBVTs0QkFBQzt5QkFBUSxFQUFFOzRCQUFFOzRCQUFXLFNBQVM7d0JBQU07b0JBRXJELEVBQUUsT0FBTyxPQUFPO3dCQUNkLFdBQVcsTUFBTTtvQkFDbkI7Z0JBQ0Y7WUFDRjtZQUNBLFdBQVUsS0FBSyxFQUFFLFVBQVU7Z0JBQ3pCLElBQUk7b0JBQ0YsV0FBVyxRQUNULFVBQVU7d0JBQUM7cUJBQU0sRUFBRTt3QkFBRTt3QkFBVyxTQUFTO3dCQUFPO29CQUFRO2dCQUU1RCxFQUFFLE9BQU8sT0FBTztvQkFDZCxXQUFXLE1BQU07Z0JBQ25CO1lBQ0Y7UUFDRjtJQUVKO0FBQ0YifQ==