import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { geomorphACA } from "./geomorphACA.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof geomorphACA).toBe("function");
  });
  test("geomorphACA - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await geomorphACA(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "geomorphACA", example.properties.name);
    }
  }, 60_000);
});
