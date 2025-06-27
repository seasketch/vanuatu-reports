import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { invertDensity } from "./invertDensity.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof invertDensity).toBe("function");
  });
  test("invertDensity - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await invertDensity(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "invertDensity", example.properties.name);
    }
  }, 60_000);
});
