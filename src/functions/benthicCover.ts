import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Point,
  ReportResult,
  createMetric,
  rekeyMetrics,
  sortMetrics,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import { booleanPointInPolygon } from "@turf/turf";

interface BenthicProperties {
  station_id?: string;
  CCA?: number;
  "Calcified Macroalgae"?: number;
  "Hard Coral"?: number;
  Invertebrate?: number;
  Macroalgae?: number;
  Other?: number;
  "Soft Coral"?: number;
  Turf?: number;
}

interface BenthicReportResult extends ReportResult {
  stations: {
    station_id: string;
    CCA: number;
    "Calcified Macroalgae": number;
    "Hard Coral": number;
    Invertebrate: number;
    Macroalgae: number;
    Other: number;
    "Soft Coral": number;
    Turf: number;
  }[];
}

/**
 * benthicCover: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function benthicCover(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<BenthicReportResult> {
  const sketchArray = toSketchArray(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("benthicCover");
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = (await getFeaturesForSketchBBoxes(sketch, url)) as Feature<
    Point,
    BenthicProperties
  >[];
  const finalFeatures = features.filter((feature) =>
    sketchArray.some((sk) => booleanPointInPolygon(feature, sk)),
  );

  // Metrics are the average benthic cover for each class in the sketch
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const propName = curClass.classId as keyof BenthicProperties;
        const classValues = finalFeatures.map((feature) =>
          feature.properties[propName] !== undefined
            ? (feature.properties[propName] as number)
            : NaN,
        );

        const average =
          classValues.reduce((sum, value) => sum + value, 0) /
          classValues.length;

        return createMetric({
          metricId: metricGroup.metricId,
          classId: curClass.classId,
          value: average,
        });
      }),
    )
  ).flat();

  // Also want to get an array of the sites and classValues
  const stations = finalFeatures.map((feature) => ({
    station_id: feature.properties.station_id || "",
    CCA: feature.properties.CCA ?? NaN,
    "Calcified Macroalgae": feature.properties["Calcified Macroalgae"] ?? NaN,
    "Hard Coral": feature.properties["Hard Coral"] ?? NaN,
    Invertebrate: feature.properties.Invertebrate ?? NaN,
    Macroalgae: feature.properties.Macroalgae ?? NaN,
    Other: feature.properties.Other ?? NaN,
    "Soft Coral": feature.properties["Soft Coral"] ?? NaN,
    Turf: feature.properties.Turf ?? NaN,
  }));

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    stations,
  };
}

export default new GeoprocessingHandler(benthicCover, {
  title: "benthicCover",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
