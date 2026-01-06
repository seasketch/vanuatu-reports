import fs from "fs-extra";
import {
  genOusClassMetrics,
  OusFeature,
  OusFeatureCollection,
  OusStats,
} from "../../src/functions/ousDemographics.js";
import {
  createMetric,
  loadFgb,
  genFeatureCollection,
} from "@seasketch/geoprocessing";
import projectClient from "../../project/projectClient.js";

const DEST_PATH = "ousDemographicPrecalcTotals.json";

async function main() {
  const url = `${projectClient.dataBucketUrl()}ous_demographics.fgb`;

  const rawShapes = await loadFgb<OusFeature>(url);

  const shapes = genFeatureCollection(rawShapes) as OusFeatureCollection;

  // Track counting of respondent/sector level stats, only need to count once
  const respondentProcessed: Record<string, Record<string, boolean>> = {};

  const countStats = shapes.features.reduce<OusStats>(
    (statsSoFar: OusStats, shape: OusFeature) => {
      if (!shape.properties) {
        console.log(`Shape missing properties ${JSON.stringify(shape)}`);
      }

      if (!shape.properties.resp_id) {
        console.log(
          `Missing respondent ID for ${JSON.stringify(shape)}, skipping`,
        );
        return statsSoFar;
      }

      const resp_id = shape.properties.resp_id;
      const village = shape.properties.village
        ? `${shape.properties.village}`
        : "unknown-village";
      const curSector: string = shape.properties.sector
        ? shape.properties.sector
        : "unknown-sector";
      const curGears: string[] = shape.properties.fishing_method
        ? shape.properties.fishing_method
            .split(",")
            .map((s: string) => s.trim())
        : ["unknown-gear"];

      // Number of people is gathered once per sector
      // So you can only know the total number of people for each sector, not overall
      const overallPeople = (() => {
        const peopleVal = shape.properties["number_of_ppl"];
        if (peopleVal !== null && peopleVal !== undefined) {
          if (typeof peopleVal === "string") {
            return parseFloat(peopleVal);
          } else {
            return peopleVal;
          }
        } else {
          return 1;
        }
      })();
      const curPeople = (() => {
        const peopleVal = shape.properties["rep_in_sector"];
        if (peopleVal !== null && peopleVal !== undefined) {
          if (typeof peopleVal === "string") {
            return parseFloat(peopleVal);
          } else {
            return peopleVal;
          }
        } else {
          return 1;
        }
      })();

      // Mutates
      let newStats: OusStats = { ...statsSoFar };

      // New respondent
      if (!respondentProcessed[resp_id]) {
        // Add respondent to total respondents
        newStats.people = newStats.people + overallPeople;

        // Add new respondent to municipality stats
        newStats.byVillage[village] = newStats.byVillage[village]
          ? newStats.byVillage[village] + overallPeople
          : overallPeople;

        respondentProcessed[resp_id] = {};
      }

      // Once per respondent and gear type counts
      curGears.forEach((curGear) => {
        if (!respondentProcessed[resp_id][curGear]) {
          newStats.byGear[curGear] = newStats.byGear[curGear]
            ? newStats.byGear[curGear] + curPeople
            : curPeople;
          respondentProcessed[resp_id][curGear] = true;
        }
      });

      // Once per respondent and sector counts
      if (!respondentProcessed[resp_id][curSector]) {
        newStats.bySector[curSector] = newStats.bySector[curSector]
          ? newStats.bySector[curSector] + curPeople
          : curPeople;
        respondentProcessed[resp_id][curSector] = true;
      }

      return newStats;
    },
    {
      people: 0,
      bySector: {},
      byVillage: {},
      byGear: {},
    },
  );

  // calculate sketch % overlap - divide sketch counts by total counts
  const overallMetrics = [
    createMetric({
      metricId: "ousPeopleCount",
      classId: "ousPeopleCount_all",
      value: countStats.people,
    }),
  ];

  const sectorMetrics = genOusClassMetrics(countStats.bySector);
  const municipalityMetrics = genOusClassMetrics(countStats.byVillage);
  const gearMetrics = genOusClassMetrics(countStats.byGear);

  const finalMetrics = {
    stats: countStats,
    metrics: [
      ...overallMetrics,
      ...sectorMetrics,
      ...municipalityMetrics,
      ...gearMetrics,
    ],
  };

  await fs.writeFile(DEST_PATH, JSON.stringify(finalMetrics.metrics, null, 2));
  console.log(`Successfully wrote ${DEST_PATH}`);
}

main();
