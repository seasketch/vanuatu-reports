import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonSum,
  Feature,
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
  // Buffer the sketch by .5km
  const bufferedSketch = (() => {
    if (isSketchCollection(sketch)) {
      return {
        ...sketch,
        features: sketch.features.map((feat) => ({
          ...feat,
          geometry: buffer(feat.geometry as Polygon | MultiPolygon, 0.5, {
            units: "kilometers",
          })!.geometry,
        })),
      };
    } else {
      return {
        ...sketch,
        geometry: buffer(sketch.geometry! as Polygon | MultiPolygon, 0.5, {
          units: "kilometers",
        })!.geometry,
      };
    }
  })();

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("population");
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = await getFeaturesForSketchBBoxes<Polygon | MultiPolygon>(
    bufferedSketch,
    url,
  );
  const classKey = project.getMetricGroupClassKey(metricGroup);

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        let finalFeatures: Feature<Polygon | MultiPolygon>[] = [];
        if (classKey === undefined)
          // Use all features
          finalFeatures = features;
        else {
          // Filter to features that are a member of this class
          finalFeatures = features.filter(
            (feat) =>
              feat.geometry &&
              feat.properties &&
              feat.properties[classKey] === curClass.classId,
          );
        }

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonSum(
          metricGroup.metricId,
          finalFeatures,
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
