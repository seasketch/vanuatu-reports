import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  rasterMetrics,
  isRasterDatasource,
  loadCog,
  DefaultExtraParams,
  GeoprocessingRequestModel,
  runLambdaWorker,
  isMetricArray,
  parseLambdaResponse,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { mangrovesWorker } from "./mangrovesWorker.js";

/**
 * mangroves: A geoprocessing function that calculates overlap metrics for raster datasources
 * @param sketch - A sketch or collection of sketches
 * @returns Calculated metrics
 */
export async function mangroves(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
  request?: GeoprocessingRequestModel<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("mangroves");

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const parameters = {
          classId: curClass.classId,
          metricGroup,
        };

        return process.env.NODE_ENV === "test"
          ? mangrovesWorker(sketch, parameters)
          : runLambdaWorker(
              sketch,
              project.package.name,
              "mangrovesWorker",
              project.geoprocessing.region,
              parameters,
              request!,
            );
      }),
    )
  ).reduce<Metric[]>(
    (metrics, result) =>
      metrics.concat(
        isMetricArray(result)
          ? result
          : (parseLambdaResponse(result) as Metric[]),
      ),
    [],
  );

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(mangroves, {
  title: "mangroves",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
  workers: ["mangrovesWorker"],
});
