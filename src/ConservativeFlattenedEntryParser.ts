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

export interface ConservativeFlattenedEntryParserOptions {
	prefix?: string;
	separator?: string;
	pragmaPrefix?: string;
	allowedFieldRegex?: RegExp;
}

export class ConservativeFlattenedEntryParser
	implements FlattenedEntryParserInterface {
	public readonly prefix: string;
	public readonly separator: string;
	public readonly pragmaPrefix: string;
	public readonly allowedFieldRegex: RegExp;

	constructor(options: ConservativeFlattenedEntryParserOptions = {}) {
		this.prefix = options.prefix !== undefined ? options.prefix : "";
		this.separator =
			options.separator !== undefined ? options.separator : ".";
		this.pragmaPrefix =
			options.pragmaPrefix !== undefined ? options.pragmaPrefix : "x-";
		this.allowedFieldRegex =
			options.allowedFieldRegex !== undefined
				? options.allowedFieldRegex
				: /^[a-zA-Z-][a-zA-Z0-9-_]*$/;
	}

	public parse([key, value]: [string, string]): FlattenedEntry {
		if (!key.startsWith(this.prefix)) {
			throw new Error("Bug. Expected key to start with prefix!");
		}
		key = key.substr(this.prefix.length);

		const parts = key.split(this.separator);
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

			if (part.startsWith(this.pragmaPrefix)) {
				const rest = part.substr(this.pragmaPrefix.length);
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
					p.name.startsWith(this.pragmaPrefix) ||
					!p.name.match(this.allowedFieldRegex)
				) {
					error = true;
				}
				return p.name;
			}
			if (p.kind === "index") {
				return `${this.pragmaPrefix}${p.index}`;
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
					path.push(`${this.pragmaPrefix}${id}`);
					break;
				}
			}
			if (!parsedValue) {
				throw new Error("Could not serialize value!");
			}
			resultValue = parsedValue;
		}

		return [path.join(this.separator), resultValue];
	}
}
