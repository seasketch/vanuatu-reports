import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { richness } from "./richness.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof richness).toBe("function");
  });
  test("richness - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await richness(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "richness", example.properties.name);
    }
  }, 60_000);
});
