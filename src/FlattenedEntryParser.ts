import { FlattenedEntry } from "./FlattenedEntry";
import { FlattenedEntryParserInterface } from "./FlattenToDictionary";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class FlattenedEntryParser implements FlattenedEntryParserInterface {
	public parse([key, value]: [string, string]): FlattenedEntry {
		throw new Error("Not implemented");
	}

	public toString(entry: FlattenedEntry): [string, string] {
		throw new Error("Not implemented");
	}
}
