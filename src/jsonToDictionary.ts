import { JSONValue } from "./JSONValue";
import { FlattenToDictionary } from "./FlattenToDictionary";

/**
 * You can assume that for every `x: JSONValue`:
 * ```ts
 * deepEqual(dictionaryToJson(jsonToDictionary(x)), x)
 * ```
 */
export function jsonToDictionary(val: JSONValue): Record<string, string> {
	return new FlattenToDictionary().flatten(val);
}

export function dictionaryToJson(val: Record<string, string>): JSONValue {
	return new FlattenToDictionary().unflatten(val);
}
