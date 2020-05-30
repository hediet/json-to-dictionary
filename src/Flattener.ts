import { JSONValue, JSONArray, JSONObject } from "./JSONValue";
import { groupBy } from "./utils";
import { FlattenedEntry } from "./FlattenedEntry";

export class Flattener {
	public flatten(value: JSONValue): FlattenedEntry[] {
		if (typeof value === "object" && value) {
			const result = new Array<FlattenedEntry>();
			if (Array.isArray(value)) {
				let index = 0;
				for (const item of value) {
					for (const itemFlattened of this.flatten(item)) {
						result.push(
							itemFlattened.prepend({ kind: "index", index })
						);
					}
					index++;
				}
			} else {
				for (const [name, val] of Object.entries(value)) {
					if (val === undefined) {
						continue;
					}
					for (const itemFlattened of this.flatten(val)) {
						result.push(
							itemFlattened.prepend({ kind: "field", name })
						);
					}
				}
			}
			return result;
		} else {
			return [new FlattenedEntry({ kind: "value", value })];
		}
	}

	public unflatten(value: FlattenedEntry[]): JSONValue {
		let result:
			| { kind: "array"; val: JSONArray }
			| { kind: "obj"; val: JSONObject }
			| { kind: "primitive"; val: JSONValue }
			| undefined;

		for (const { items } of groupBy(value, (e) =>
			JSON.stringify(Object.assign({}, e.data, { value: undefined }))
		).values()) {
			const first = items[0];
			if (first.data.kind === "value") {
				if (items.length !== 1) {
					throw new Error(
						`Conflicting entries: ${items
							.map((i) => `"${i.toString()}"`)
							.join(", ")}`
					);
				}
				if (result) {
					// TODO improve error
					throw new Error("Conflict");
				}
				result = { kind: "primitive", val: first.data.value };
			} else if (first.data.kind === "index") {
				if (!result) {
					result = { kind: "array", val: [] };
				} else if (result.kind !== "array") {
					throw new Error("Conflict");
				}

				// TODO improve groupBy so that we don't need need to cast.
				const val = this.unflatten(
					items.map((i) => i.data.value as FlattenedEntry)
				);
				result.val[first.data.index] = val;
			} else if (first.data.kind === "field") {
				if (!result) {
					result = { kind: "obj", val: {} };
				} else if (result.kind !== "obj") {
					throw new Error("Conflict");
				}
				// TODO improve groupBy so that we don't need need to cast.
				const val = this.unflatten(
					items.map((i) => i.data.value as FlattenedEntry)
				);
				result.val[first.data.name] = val;
			}
		}

		if (!result) {
			throw new Error("Invalid input");
		}
		return result.val;
	}
}
