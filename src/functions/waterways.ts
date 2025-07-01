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
  LineString,
  ReportResult,
  toSketchArray,
  createMetric,
} from "@seasketch/geoprocessing/client-core";
import { buffer } from "@turf/turf";
import { booleanIntersects } from "@turf/turf";

/**
 * waterways: A geoprocessing function
 */
export async function waterways(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const sketchArray = toSketchArray(sketch);

  // Buffer the sketch polygons by 1km
  let bufferedSketch = sketch;
  if (Array.isArray(sketchArray) && sketchArray.length > 1) {
    // SketchCollection
    bufferedSketch = {
      ...(sketch as SketchCollection<Polygon | MultiPolygon>),
      features: sketchArray.map((feat) => ({
        ...feat,
        geometry: buffer(feat.geometry as Polygon | MultiPolygon, 1, {
          units: "kilometers",
        })!.geometry,
      })),
    };
  } else {
    // Single Sketch
    if (!sketchArray[0].geometry) {
      return { metrics: [] };
    }
    bufferedSketch = {
      ...(sketchArray[0] as Sketch<Polygon | MultiPolygon>),
      geometry: buffer(sketchArray[0].geometry as Polygon | MultiPolygon, 1, {
        units: "kilometers",
      })!.geometry,
    };
  }

  // Fetch features overlapping with buffered sketch
  const metricGroup = project.getMetricGroup("waterways");
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);

  const features = (await getFeaturesForSketchBBoxes(
    bufferedSketch,
    url,
  )) as Feature<LineString>[];

  // Convert bufferedSketch to array for intersection testing
  const bufferedArray = toSketchArray(bufferedSketch);

  // Count features whose geometry intersects the buffered polygon
  const count = features.filter((feature) =>
    bufferedArray.some((sketchFeature) =>
      booleanIntersects(feature.geometry, sketchFeature.geometry),
    ),
  ).length;

  return {
    metrics: [
      createMetric({
        metricId: metricGroup.metricId,
        value: count,
      }),
    ],
  };
}

export default new GeoprocessingHandler(waterways, {
  title: "waterways",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
