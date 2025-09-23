import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonSum,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  isSketchCollection,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { buffer } from "@turf/turf";

/**
 * population: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @returns Calculated metrics and a null sketch
 */
export async function population(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  // Buffer the sketch polygons by .5km
  let bufferedSketch = sketch;
  if (isSketchCollection(sketch)) {
    // SketchCollection
    if (sketch.features.some((feat) => !feat.geometry)) {
      return { metrics: [] };
    }
    bufferedSketch = {
      ...sketch,
      features: sketch.features.map((feat) => ({
        ...feat,
        geometry: buffer(feat.geometry as Polygon | MultiPolygon, 0.5, {
          units: "kilometers",
        })!.geometry,
      })),
    };
  } else {
    // Single Sketch
    if (!sketch.geometry) {
      return { metrics: [] };
    }
    bufferedSketch = {
      ...sketch,
      geometry: buffer(sketch.geometry! as Polygon | MultiPolygon, 0.5, {
        units: "kilometers",
      })!.geometry,
    };
  }

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("population");
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with sketch
        const features = await getFeaturesForSketchBBoxes<
          Polygon | MultiPolygon
        >(bufferedSketch, url);

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonSum(
          metricGroup.metricId,
          features,
          bufferedSketch,
          { sumProperty: "Population" },
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

export default new GeoprocessingHandler(population, {
  title: "population",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
