import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { landUse } from "./landUse.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof landUse).toBe("function");
  });
  test("landUse - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await landUse(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "landUse", example.properties.name);
    }
  }, 60_000);
});
