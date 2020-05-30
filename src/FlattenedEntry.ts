import { JSONValue } from "./JSONValue";
import { FlattenedEntryParser } from "./FlattenedEntryParser";

export class FlattenedEntry {
	public static from(path: PathItem[], value: JSONValue): FlattenedEntry {
		if (path.length === 0) {
			return new FlattenedEntry({ kind: "value", value });
		} else {
			if (path[0].kind === "field") {
				return new FlattenedEntry({
					kind: "field",
					name: path[0].name,
					value: this.from(path.slice(1), value),
				});
			} else {
				return new FlattenedEntry({
					kind: "index",
					index: path[0].index,
					value: this.from(path.slice(1), value),
				});
			}
		}
	}

	constructor(
		public readonly data:
			| { kind: "field"; name: string; value: FlattenedEntry }
			| { kind: "index"; index: number; value: FlattenedEntry }
			| { kind: "value"; value: JSONValue }
	) {}

	toString(): string {
		return new FlattenedEntryParser().toString(this).join(": ");
	}

	public get path(): ReadonlyArray<PathItem> {
		if (this.data.kind === "value") {
			return [];
		}
		const p = [...this.data.value.path];
		p.unshift(
			this.data.kind === "index"
				? { kind: "index", index: this.data.index }
				: { kind: "field", name: this.data.name }
		);
		return p;
	}

	public get value(): Readonly<JSONValue> {
		if (this.data.kind === "value") {
			return this.data.value;
		}
		return this.data.value.value;
	}

	public serialize(): unknown {
		return {
			path: this.path,
			value: this.value,
		};
	}

	public prepend(path: PathItem): FlattenedEntry {
		if (path.kind === "field") {
			return new FlattenedEntry({
				kind: "field",
				name: path.name,
				value: this,
			});
		} else if (path.kind === "index") {
			return new FlattenedEntry({
				kind: "index",
				index: path.index,
				value: this,
			});
		} else {
			throw new Error();
		}
	}
}

export type PathItem =
	| {
			kind: "field";
			name: string;
	  }
	| {
			kind: "index";
			index: number;
	  };
