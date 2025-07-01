import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { waterways } from "./waterways.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof waterways).toBe("function");
  });
  test("waterways - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await waterways(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "waterways", example.properties.name);
    }
  }, 60_000);
});
