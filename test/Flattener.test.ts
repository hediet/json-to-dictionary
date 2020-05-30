import { Flattener, JSONValue, FlattenedEntry } from "../src";
import { deepEqual, throws } from "assert";

describe("Flattener", () => {
	const f = new Flattener();

	describe("flatten", () => {
		function flatten(val: JSONValue): unknown[] {
			return f.flatten(val).map((e) => e.serialize());
		}

		it("primitives", () => {
			deepEqual(flatten("string"), [
				{
					path: [],
					value: "string",
				},
			]);

			deepEqual(flatten(1), [
				{
					path: [],
					value: 1,
				},
			]);

			deepEqual(flatten(true), [
				{
					path: [],
					value: true,
				},
			]);
		});

		it("objects", () => {
			deepEqual(flatten({ prop1: 1, prop2: "string" }), [
				{
					path: [{ kind: "field", name: "prop1" }],
					value: 1,
				},
				{
					path: [{ kind: "field", name: "prop2" }],
					value: "string",
				},
			]);
		});

		it("array", () => {
			deepEqual(flatten([1, 2, "str"]), [
				{
					path: [{ index: 0, kind: "index" }],
					value: 1,
				},
				{
					path: [{ index: 1, kind: "index" }],
					value: 2,
				},
				{
					path: [{ index: 2, kind: "index" }],
					value: "str",
				},
			]);
		});

		it("nested", () => {
			deepEqual(
				flatten({ prop1: 1, prop2: ["str", { foo: [1, 2, [3]] }] }),
				[
					{
						path: [{ kind: "field", name: "prop1" }],
						value: 1,
					},
					{
						path: [
							{ kind: "field", name: "prop2" },
							{ kind: "index", index: 0 },
						],
						value: "str",
					},
					{
						path: [
							{ kind: "field", name: "prop2" },
							{ kind: "index", index: 1 },
							{ kind: "field", name: "foo" },
							{ kind: "index", index: 0 },
						],
						value: 1,
					},
					{
						path: [
							{ kind: "field", name: "prop2" },
							{ kind: "index", index: 1 },
							{ kind: "field", name: "foo" },
							{ kind: "index", index: 1 },
						],
						value: 2,
					},
					{
						path: [
							{ kind: "field", name: "prop2" },
							{ kind: "index", index: 1 },
							{ kind: "field", name: "foo" },
							{ kind: "index", index: 2 },
							{ kind: "index", index: 0 },
						],
						value: 3,
					},
				]
			);
		});
	});

	describe("unflatten", () => {
		it("primitives", () => {
			deepEqual(f.unflatten([FlattenedEntry.from([], 1)]), 1);
			deepEqual(f.unflatten([FlattenedEntry.from([], "str")]), "str");
		});

		it("objects", () => {
			deepEqual(
				f.unflatten([
					FlattenedEntry.from([{ kind: "field", name: "prop1" }], 1),
					FlattenedEntry.from(
						[{ kind: "field", name: "prop2" }],
						"str"
					),
				]),
				{
					prop1: 1,
					prop2: "str",
				}
			);
		});

		it("nested", () => {
			deepEqual(
				f.unflatten([
					FlattenedEntry.from(
						[
							{ kind: "field", name: "prop1" },
							{ kind: "field", name: "prop1" },
						],
						1
					),
					FlattenedEntry.from(
						[
							{ kind: "field", name: "prop1" },
							{ kind: "field", name: "prop2" },
						],
						1
					),
					FlattenedEntry.from(
						[
							{ kind: "field", name: "prop2" },
							{ kind: "field", name: "prop1" },
						],
						1
					),
				]),
				{
					prop1: { prop1: 1, prop2: 1 },
					prop2: { prop1: 1 },
				}
			);
		});

		describe("conflicts", () => {
			it("direct conflicts", () => {
				throws(() => {
					f.unflatten([
						FlattenedEntry.from(
							[{ kind: "field", name: "prop1" }],
							1
						),
						FlattenedEntry.from(
							[{ kind: "field", name: "prop1" }],
							"str"
						),
					]);
				});
			});
			it("indirect conflicts", () => {
				throws(() => {
					f.unflatten([
						FlattenedEntry.from(
							[
								{ kind: "field", name: "prop1" },
								{ kind: "field", name: "prop1" },
							],
							1
						),
						FlattenedEntry.from(
							[{ kind: "field", name: "prop1" }],
							"str"
						),
					]);
				});

				throws(() => {
					f.unflatten([
						FlattenedEntry.from(
							[
								{ kind: "field", name: "prop1" },
								{ kind: "field", name: "prop1" },
							],
							1
						),
						FlattenedEntry.from(
							[
								{ kind: "field", name: "prop1" },
								{ kind: "index", index: 0 },
							],
							"str"
						),
					]);
				});
			});
		});
	});
});
