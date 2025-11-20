import {
  getExamplePolygonSketchAll,
  writeResultOutput,
  polygonSmokeTest,
  getExampleFeatures,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { bathymetry } from "./bathymetry.js";
import { benthicACA } from "./benthicACA.js";
import { benthicCover } from "./benthicCover.js";
import { bleachingAlerts } from "./bleachingAlerts.js";
import handler, { clipToOceanEez } from "./clipToOceanEez.js";
import { dhw } from "./dhw.js";
import { fishBiomass } from "./fishBiomass.js";
import { fishDensity } from "./fishDensity.js";
import { geomorphology } from "./geomorphology.js";
import { gfw } from "./gfw.js";
import { juvenileCoralDensity } from "./juvenileCoralDensity.js";
import { mangroves } from "./mangroves.js";
import { sites } from "./sites.js";
import { size } from "./size.js";
import { geomorphACA } from "./geomorphACA.js";
import { invertDensity } from "./invertDensity.js";
import { isotopes } from "./isotopes.js";
import { landUse } from "./landUse.js";
import { population } from "./population.js";
import { reefExtentACA } from "./reefExtentACA.js";
import { seamounts } from "./seamounts.js";
import { waterways } from "./waterways.js";
import { richness } from "./richness.js";

// Create standard smoke tests
function createSmokeTest(
  functionName: string,
  functionToTest: Function,
  timeout: number = 60_000,
) {
  describe(functionName, () => {
    test("handler function is present", () => {
      expect(typeof functionToTest).toBe("function");
    });

    test(
      `${functionName} - tests run against all examples`,
      async () => {
        const examples = await getExamplePolygonSketchAll();
        for (const example of examples) {
          const result = await functionToTest(example);
          expect(result).toBeTruthy();
          writeResultOutput(result, functionName, example.properties.name);
        }
      },
      timeout,
    );
  });
}

const tests = [
  { name: "bathymetry", func: bathymetry },
  { name: "benthicACA", func: benthicACA },
  { name: "benthicCover", func: benthicCover },
  { name: "bleachingAlerts", func: bleachingAlerts },
  { name: "dhw", func: dhw },
  { name: "fishBiomass", func: fishBiomass },
  { name: "fishDensity", func: fishDensity },
  { name: "geomorphology", func: geomorphology },
  { name: "geomorphACA", func: geomorphACA },
  { name: "gfw", func: gfw },
  { name: "invertDensity", func: invertDensity },
  { name: "isotopes", func: isotopes },
  { name: "juvenileCoralDensity", func: juvenileCoralDensity },
  { name: "landUse", func: landUse },
  { name: "mangroves", func: mangroves },
  { name: "population", func: population },
  { name: "reefExtentACA", func: reefExtentACA },
  { name: "richness", func: richness },
  { name: "seamounts", func: seamounts },
  { name: "sites", func: sites },
  { name: "size", func: size },
  { name: "waterways", func: waterways },
];

// Generate tests
tests.forEach(({ name, func }) => {
  createSmokeTest(name, func);
});

// clipToOceanEez - special case
describe("clipToOceanEez", () => {
  test("clipToOceanEez", async () => {
    const examples = await getExampleFeatures();
    polygonSmokeTest(clipToOceanEez, handler.options.title, examples, {
      timeout: 60_000,
      debug: false,
    });
  }, 60_000);
});
