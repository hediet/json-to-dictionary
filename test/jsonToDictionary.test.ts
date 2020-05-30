/*
import { deepEqual } from "assert";
import { JSONValue } from "../src/JSONValue";
import { jsonToDictionary, dictionaryToJson } from "../src/jsonToDictionary";

function safeJsonToDictionary(value: JSONValue): Record<string, string> {
	const dict = jsonToDictionary(value);
	deepEqual(dictionaryToJson(dict), value);
	return dict;
}


describe("Test", () => {
	it("works", () => {
		deepEqual(safeJsonToDictionary({}), {
			":": "{}",
		});

		deepEqual(safeJsonToDictionary([]), {
			":": "[]",
		});

		deepEqual(safeJsonToDictionary([1]), {
			"[0]:num": "1",
		});

		deepEqual(safeJsonToDictionary(["1"]), {
			"[0]": "1",
		});

		deepEqual(safeJsonToDictionary([{}]), {
			"[0]:": "{}",
		});

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
				"start.line:num": "148",
				"start.col:num": "8",
				"end.line:num": "148",
				"end.col:num": "20",
			}
		);
	});
});
*/
