import {} from "mocha";
import { deepEqual } from "assert";
import {
	FlattenToDictionary,
	JSONValue,
	ConservativeFlattenedEntryParserOptions,
} from "../src";
import { ConservativeFlattenedEntryParser } from "../src";

function safeJsonToDictionary(
	value: JSONValue,
	options: ConservativeFlattenedEntryParserOptions = {}
): Record<string, string> {
	const f = new FlattenToDictionary({
		parser: new ConservativeFlattenedEntryParser(options),
	});
	const dict = f.flatten(value);
	deepEqual(f.unflatten(dict), value);
	return dict;
}

describe("XmlAttributesFlattenedEntryParser", () => {
	it("Integration Simple", () => {
		deepEqual(safeJsonToDictionary(1), {
			"x-num": "1",
		});

		deepEqual(safeJsonToDictionary(1, { prefix: "pre.fix" }), {
			"pre.fix.x-num": "1",
		});

		deepEqual(
			safeJsonToDictionary(1, {
				prefix: "pre.fix",
				pragmaPrefix: "y-",
				separator: "_",
			}),
			{
				"pre.fix_y-num": "1",
			}
		);

		deepEqual(safeJsonToDictionary("str"), {
			"": "str",
		});

		deepEqual(safeJsonToDictionary("str", { prefix: "pre.fix" }), {
			"pre.fix": "str",
		});
	});

	it("Integration Example Draw.io Code Position", () => {
		deepEqual(
			safeJsonToDictionary({
				uri:
					"vscode-userdata:/c%3A/Users/henni/AppData/Roaming/Code/User/settings.json",
				start: { col: 8, line: 148 },
				end: { col: 20, line: 148 },
			}),
			{
				uri:
					"vscode-userdata:/c%3A/Users/henni/AppData/Roaming/Code/User/settings.json",
				"start.line.x-num": "148",
				"start.col.x-num": "8",
				"end.line.x-num": "148",
				"end.col.x-num": "20",
			}
		);
	});

	it("Integration Arrays", () => {
		deepEqual(
			safeJsonToDictionary({
				data: [1, 2, 3],
			}),
			{
				"data.x-0.x-num": "1",
				"data.x-1.x-num": "2",
				"data.x-2.x-num": "3",
			}
		);

		deepEqual(
			safeJsonToDictionary(
				{
					data: [1, 2, 3],
				},
				{ prefix: "test" }
			),
			{
				"test.data.x-0.x-num": "1",
				"test.data.x-1.x-num": "2",
				"test.data.x-2.x-num": "3",
			}
		);
	});

	it("Integration Malformed Properties", () => {
		deepEqual(
			safeJsonToDictionary({
				["invalid text"]: 1,
			}),
			{
				"x-json": '{"invalid text":1}',
			}
		);

		deepEqual(
			safeJsonToDictionary({
				[""]: 1,
			}),
			{
				"x-json": '{"":1}',
			}
		);
	});
});
