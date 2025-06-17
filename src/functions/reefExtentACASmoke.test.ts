import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { reefExtentACA } from "./reefExtentACA.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof reefExtentACA).toBe("function");
  });
  test("reefExtentACA - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await reefExtentACA(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "reefExtentACA", example.properties.name);
    }
  }, 60_000);
});
