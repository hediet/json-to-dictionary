import { FlattenedEntry, PathItem } from "./FlattenedEntry";
import { FlattenedEntryParserInterface } from "./FlattenToDictionary";

const parsers = {
	num: {
		parse: (x: string) => parseFloat(x),
		serialize: (x: unknown) => {
			if (typeof x !== "number") {
				return undefined;
			}
			return x.toString(10);
		},
	},
	bool: {
		parse: (x: string) => x === "true",
		serialize: (x: unknown) => {
			if (typeof x !== "boolean") {
				return undefined;
			}
			return x ? "true" : "false";
		},
	},
	json: {
		parse: (x: string) => JSON.parse(x),
		serialize: (x: unknown) => JSON.stringify(x),
	},
};

export class XmlAttributesFlattenedEntryParser
	implements FlattenedEntryParserInterface {
	constructor(public readonly prefix: string = "") {}

	public parse([key, value]: [string, string]): FlattenedEntry {
		if (!key.startsWith(this.prefix)) {
			throw new Error("Bug. Expected key to start with prefix!");
		}
		key = key.substr(this.prefix.length);

		const parts = key.split(".");
		let parser: keyof typeof parsers | undefined = undefined;

		const path = new Array<PathItem>();

		if (parts[0] === "") {
			parts.shift();
		}

		for (const part of parts) {
			if (parser) {
				throw new Error(
					`Unexpected part "${part}" after parser specification`
				);
			}

			if (part.startsWith("x-")) {
				const rest = part.substr(2);
				const newParser = Object.keys(parsers).find((p) => p === rest);
				if (newParser) {
					parser = newParser as any;
				} else if (rest.match(/[0-9]+/)) {
					const n = parseInt(rest);
					path.push({ kind: "index", index: n });
				} else {
					throw new Error(`Unrecognized instruction "${part}"`);
				}
			} else {
				path.push({ kind: "field", name: part });
			}
		}

		const val = parser ? parsers[parser].parse(value) : value;
		return FlattenedEntry.from(path, val);
	}

	public toString(entry: FlattenedEntry): [string, string] | undefined {
		let error = false;

		const path = entry.path.map((p) => {
			if (p.kind === "field") {
				if (
					p.name.startsWith("x-") ||
					!p.name.match(/^[a-zA-Z-][a-zA-Z0-9-_]*$/)
				) {
					error = true;
				}
				return p.name;
			}
			if (p.kind === "index") {
				return `x-${p.index}`;
			}
		});

		if (this.prefix) {
			path.unshift(this.prefix);
		}

		if (error) {
			return undefined;
		}

		const value = entry.value;
		let resultValue: string;
		if (typeof value === "string") {
			resultValue = value;
		} else {
			let parsedValue: string | undefined = undefined;
			for (const [id, parser] of Object.entries(parsers)) {
				parsedValue = parser.serialize(value);
				if (parsedValue !== undefined) {
					path.push(`x-${id}`);
					break;
				}
			}
			if (!parsedValue) {
				throw new Error("Could not serialize value!");
			}
			resultValue = parsedValue;
		}

		return [path.join("."), resultValue];
	}
}
