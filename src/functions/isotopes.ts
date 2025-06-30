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

interface IsotopeProperties {
  station_id?: string;
  mean_d15n?: number;
  mean_total_n?: number;
}

interface IsotopeReportResult extends ReportResult {
  stations: {
    station_id: string;
    ratio: number;
  }[];
}

/**
 * isotopes: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function isotopes(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<IsotopeReportResult> {
  const sketchArray = toSketchArray(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("isotopes");
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = (await getFeaturesForSketchBBoxes(sketch, url)) as Feature<
    Point,
    IsotopeProperties
  >[];
  const finalFeatures = features.filter((feature) =>
    sketchArray.some((sk) => booleanPointInPolygon(feature, sk)),
  );

  // Metrics are the average percent 15N
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const classValues = finalFeatures.map((feature) =>
          feature.properties.mean_d15n !== undefined &&
          feature.properties.mean_total_n !== undefined
            ? feature.properties.mean_d15n / feature.properties.mean_total_n
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
    ratio:
      feature.properties.mean_d15n !== undefined &&
      feature.properties.mean_total_n !== undefined
        ? feature.properties.mean_d15n / feature.properties.mean_total_n
        : NaN,
  }));

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    stations,
  };
}

export default new GeoprocessingHandler(isotopes, {
  title: "isotopes",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
