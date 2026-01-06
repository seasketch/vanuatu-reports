import {
  Sketch,
  GeoprocessingHandler,
  Polygon,
  MultiPolygon,
  ReportResult,
  SketchCollection,
  genFeatureCollection,
  Nullable,
  Feature,
  FeatureCollection,
  getFeaturesForSketchBBoxes,
  loadFgb,
  toSketchArray,
  clip,
  createMetric,
} from "@seasketch/geoprocessing";
import { Metric } from "@seasketch/geoprocessing/client-core";
import projectClient from "../../project/projectClient.js";
import { featureCollection, intersect } from "@turf/turf";

export interface OusFeatureProperties {
  resp_id: number;
  sector?: Nullable<string>;
  village?: Nullable<string>;
  fishing_method?: Nullable<string>;
  number_of_ppl: string | number;
  rep_in_sector: string | number;
}

export type OusFeature = Feature<MultiPolygon | Polygon, OusFeatureProperties>;
export type OusFeatureCollection = FeatureCollection<
  MultiPolygon | Polygon,
  OusFeatureProperties
>;

export type ClassCountStats = Record<string, number>;

export interface OusStats {
  people: number;
  bySector: ClassCountStats;
  byVillage: ClassCountStats;
  byGear: ClassCountStats;
}

export type OusReportResult = {
  stats: OusStats;
  metrics: Metric[];
};

/** Calculate sketch area overlap inside and outside of multiple planning area boundaries */
export async function ousDemographics(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const url = `${projectClient.dataBucketUrl()}ous_demographics.fgb`;

  const rawShapes = (await getFeaturesForSketchBBoxes(
    sketch,
    url,
  )) as OusFeature[];

  const shapes = genFeatureCollection(rawShapes) as OusFeatureCollection;

  const combinedSketch = (() => {
    const sketches = toSketchArray(
      sketch as
        | Sketch<Polygon | MultiPolygon>
        | SketchCollection<Polygon | MultiPolygon>,
    );
    const sketchColl = featureCollection(sketches);
    return sketch ? clip(sketchColl, "union") : null;
  })();

  // Track counting of respondent/sector level stats, only need to count once
  const respondentProcessed: Record<string, Record<string, boolean>> = {};

  // Track counting of max represented people for respondent stats
  const maxPeoplePerRespondent: Record<string, number> = {};

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

      let isOverlapping: boolean;
      if (!combinedSketch) {
        isOverlapping = true;
      } else {
        try {
          isOverlapping = !!intersect(
            featureCollection([shape, combinedSketch!]),
          );
          if (!isOverlapping) return statsSoFar;
        } catch {
          console.log(JSON.stringify(shape), JSON.stringify(combinedSketch));
          throw new Error("Error in intersect");
        }
      }
      if (!isOverlapping) return statsSoFar;

      const resp_id = shape.properties.resp_id;
      const totalPeople = (() => {
        const totalPeopleVal = shape.properties.number_of_ppl;
        if (totalPeopleVal !== null && totalPeopleVal !== undefined) {
          if (typeof totalPeopleVal === "string") {
            return parseFloat(totalPeopleVal);
          } else {
            return totalPeopleVal;
          }
        } else {
          return 1;
        }
      })();
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

      // If new respondent
      if (!respondentProcessed[resp_id]) {
        // Add respondent to total respondents
        newStats.people = newStats.people + curPeople;

        // Add new respondent to municipality stats
        newStats.byVillage[village] = newStats.byVillage[village]
          ? newStats.byVillage[village] + curPeople
          : curPeople;

        respondentProcessed[resp_id] = {};

        // Keep track of # people this respondent represents
        respondentProcessed[resp_id][curPeople] = true;
        maxPeoplePerRespondent[resp_id] = curPeople;
      }

      // If new number of people represented by respondent, add them up to max
      if (!respondentProcessed[resp_id][curPeople]) {
        let newPeopleCount = 0;
        const sum = maxPeoplePerRespondent[resp_id] + curPeople;
        if (sum > totalPeople) {
          newPeopleCount = totalPeople;
        } else {
          newPeopleCount = sum;
        }

        const addnPeople = newPeopleCount - maxPeoplePerRespondent[resp_id];

        newStats.people += addnPeople;
        newStats.byVillage[village] += addnPeople;
        maxPeoplePerRespondent[resp_id] = newPeopleCount;
        respondentProcessed[resp_id][curPeople] = true;
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
      ...(sketch ? { sketchId: sketch.properties.id } : {}),
    }),
  ];

  const sectorMetrics = genOusClassMetrics(countStats.bySector, sketch);
  const municipalityMetrics = genOusClassMetrics(countStats.byVillage, sketch);
  const gearMetrics = genOusClassMetrics(countStats.byGear, sketch);

  const finalMetrics = {
    stats: countStats,
    metrics: [
      ...overallMetrics,
      ...sectorMetrics,
      ...municipalityMetrics,
      ...gearMetrics,
    ],
  };

  return finalMetrics;
}

/** Generate metrics from OUS class stats */
export function genOusClassMetrics<G extends Polygon | MultiPolygon>(
  classStats: ClassCountStats,
  /** optionally calculate stats for OUS shapes that overlap with sketch  */
  sketch?:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Metric[] {
  return Object.keys(classStats)
    .map((curClass) => [
      createMetric({
        metricId: "ousPeopleCount",
        classId: curClass,
        value: classStats[curClass],
        ...(sketch ? { sketchId: sketch.properties.id } : {}),
      }),
    ])
    .reduce<Metric[]>((soFar, classMetrics) => soFar.concat(classMetrics), []);
}

export default new GeoprocessingHandler(ousDemographics, {
  title: "ousDemographics",
  description: "Calculates ous overlap metrics",
  timeout: 900, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  memory: 10240,
  requiresProperties: [],
});
