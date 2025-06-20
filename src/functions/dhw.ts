import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isRasterDatasource,
  loadCog,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import { isSketchCollection } from "@seasketch/geoprocessing/client-core";

// @ts-expect-error no types
import geoblaze from "geoblaze";

export interface DHWResults {
  min: number;
  max: number;
  mean: number;
  year: number;
}

/**
 * dhw: A geoprocessing function that calculates degree heating weeks
 */
export async function dhw(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<DHWResults[]> {
  if (isSketchCollection(sketch)) return [];

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("dhw");
  const metrics: DHWResults[] = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isRasterDatasource(ds))
          throw new Error(`Expected raster datasource for ${ds.datasourceId}`);

        const url = project.getDatasourceUrl(ds);

        // Load raster metadata
        const raster = await loadCog(url);

        try {
          const stats = (
            await geoblaze.stats(raster, sketch, {
              calcMax: true,
              calcMean: true,
              calcMin: true,
            })
          )[0];
          return {
            min: stats.min !== undefined ? stats.min : null,
            max: stats.max !== undefined ? stats.max : null,
            mean: stats.mean !== undefined ? stats.mean : null,
            year: Number(curClass.classId),
          };
        } catch (err) {
          if (err === "No Values were found in the given geometry") {
            return {
              min: null,
              mean: null,
              max: null,
              year: Number(curClass.classId),
            };
          } else {
            throw err;
          }
        }
      }),
    )
  ).flat();

  return metrics;
}

export default new GeoprocessingHandler(dhw, {
  title: "dhw",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
