import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonArea,
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
 * landUse: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @returns Calculated metrics and a null sketch
 */
export async function landUse(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  // Buffer the sketch polygons by 1km
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
        geometry: buffer(feat.geometry as Polygon | MultiPolygon, 1, {
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
      geometry: buffer(sketch.geometry! as Polygon | MultiPolygon, 1, {
        units: "kilometers",
      })!.geometry,
    };
  }

  const featuresByDatasource: Record<
    string,
    Feature<Polygon | MultiPolygon>[]
  > = {};

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("landUse");
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
        const features =
          featuresByDatasource[ds.datasourceId] ||
          (await getFeaturesForSketchBBoxes(bufferedSketch, url));
        featuresByDatasource[ds.datasourceId] = features;

        // Get classKey for current data class
        const classKey = project.getMetricGroupClassKey(metricGroup, {
          classId: curClass.classId,
        });

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
        const overlapResult = await overlapPolygonArea(
          metricGroup.metricId,
          finalFeatures,
          bufferedSketch,
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

export default new GeoprocessingHandler(landUse, {
  title: "landUse",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
