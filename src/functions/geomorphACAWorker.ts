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
  MetricGroup,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";

/**
 * geomorphACAWorker: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function geomorphACAWorker(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: { classId: string; metricGroup: MetricGroup },
): Promise<Metric[]> {
  const ds = project.getMetricGroupDatasource(extraParams.metricGroup, {
    classId: extraParams.classId,
  });
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);

  const features = await getFeaturesForSketchBBoxes<Polygon | MultiPolygon>(
    sketch,
    url,
  );

  // Get classKey for current data class
  const classKey = project.getMetricGroupClassKey(extraParams.metricGroup, {
    classId: extraParams.classId,
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
        feat.properties[classKey] === extraParams.classId,
    );
  }

  // Calculate overlap metrics
  const overlapResult = await overlapPolygonArea(
    extraParams.metricGroup.metricId,
    finalFeatures,
    sketch,
  );

  const metrics = overlapResult.map(
    (metric): Metric => ({
      ...metric,
      classId: extraParams.classId,
      geographyId: "eez",
    }),
  );

  return sortMetrics(rekeyMetrics(metrics));
}

export default new GeoprocessingHandler(geomorphACAWorker, {
  title: "geomorphACAWorker",
  description: "",
  timeout: 500, // seconds
  memory: 4096, // megabytes
  executionMode: "sync",
});
