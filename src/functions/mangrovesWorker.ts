import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  rasterMetrics,
  isRasterDatasource,
  loadCog,
  MetricGroup,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import { Metric } from "@seasketch/geoprocessing/client-core";

/**
 * mangrovesWorker: A geoprocessing function that calculates overlap metrics for raster datasources
 * @param sketch - A sketch or collection of sketches
 * @returns Calculated metrics
 */
export async function mangrovesWorker(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: {
    classId: string;
    metricGroup: MetricGroup;
  },
): Promise<Metric[]> {
  const ds = project.getMetricGroupDatasource(extraParams.metricGroup, {
    classId: extraParams.classId,
  });
  if (!isRasterDatasource(ds))
    throw new Error(`Expected raster datasource for ${ds.datasourceId}`);

  const url = project.getDatasourceUrl(ds);

  // Load raster metadata
  const raster = await loadCog(url);

  // Run raster analysis
  const overlapResult = await rasterMetrics(raster, {
    metricId: extraParams.metricGroup.metricId,
    feature: sketch,
    stats: ["area"],
  });

  return overlapResult.map(
    (metrics): Metric => ({
      ...metrics,
      classId: extraParams.classId,
      geographyId: "eez",
    }),
  );
}

export default new GeoprocessingHandler(mangrovesWorker, {
  title: "mangrovesWorker",
  description: "",
  timeout: 500, // seconds
  memory: 4096, // megabytes
  executionMode: "sync",
});
