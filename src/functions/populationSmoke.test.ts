import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { population } from "./population.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof population).toBe("function");
  });
  test("population - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await population(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "population", example.properties.name);
    }
  }, 60_000);
});
