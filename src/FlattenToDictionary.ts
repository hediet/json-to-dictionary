import { JSONValue } from "./JSONValue";
import { Flattener } from "./Flattener";
import { FlattenedEntryParser } from "./FlattenedEntryParser";
import { FlattenedEntry } from "./FlattenedEntry";

export class FlattenToDictionary {
	public readonly parser: FlattenedEntryParserInterface;
	public readonly flattener: Flattener;

	constructor(
		options: {
			parser?: FlattenedEntryParserInterface;
			flattener?: Flattener;
		} = {}
	) {
		this.parser = options.parser || new FlattenedEntryParser();
		this.flattener = options.flattener || new Flattener();
	}

	public flatten(value: JSONValue): Record<string, string> {
		const entries = this.flattener.flatten(value);
		const result: Record<string, string> = {};
		let error = false;
		for (const entry of entries) {
			const stringified = this.parser.toString(entry);
			if (!stringified) {
				error = true;
				break;
			}
			const [key, value] = stringified;
			result[key] = value;
		}

		if (error) {
			// Fall back to generic json approach.
			const stringified = this.parser.toString(
				FlattenedEntry.from([], value)
			);
			if (!stringified) {
				throw new Error("Bug. Invalid parser");
			}
			return {
				[stringified[0]]: stringified[1],
			};
		}

		return result;
	}

	public unflatten(value: Record<string, string>): JSONValue {
		const entries = Object.entries(value).map((kv) =>
			this.parser.parse(kv)
		);
		return this.flattener.unflatten(entries);
	}
}

export interface FlattenedEntryParserInterface {
	parse([key, value]: [string, string]): FlattenedEntry;
	toString(entry: FlattenedEntry): [string, string] | undefined;
}
