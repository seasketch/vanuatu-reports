import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { isotopes } from "./isotopes.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof isotopes).toBe("function");
  });
  test("isotopes - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await isotopes(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "isotopes", example.properties.name);
    }
  }, 60_000);
});
