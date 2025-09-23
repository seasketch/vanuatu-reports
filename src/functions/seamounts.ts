import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  Point,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { overlapPoints } from "../util/overlapPoints.js";

/**
 * seamounts: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @returns Calculated metrics and a null sketch
 */
export async function seamounts(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("seamounts");
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with sketch, if not already fetched
        const features = await getFeaturesForSketchBBoxes<Point>(sketch, url);

        // Calculate overlap metrics
        const overlapResult = await overlapPoints(
          metricGroup.metricId,
          features,
          sketch,
        );

        return overlapResult.map(
          (metric): Metric => ({
            ...metric,
            classId: curClass.classId,
          }),
        );
      }),
    )
  ).flat();

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(seamounts, {
  title: "seamounts",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
