import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  createMetric,
  toSketchArray,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  Point,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

interface SiteProperties {
  station_id?: string;
  island?: string;
  province?: string;
}

interface SiteReportResult extends ReportResult {
  stations: { station_id: string; island: string; province: string }[];
}

/**
 * sites: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function sites(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<SiteReportResult> {
  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("sites");
  const curClass = metricGroup.classes[0];
  const ds = project.getMetricGroupDatasource(metricGroup, {
    classId: curClass.classId,
  });
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);

  // Fetch features overlapping with sketch
  const features = (await getFeaturesForSketchBBoxes(sketch, url)) as Feature<
    Point,
    SiteProperties
  >[];

  // Get unique counts and feature properties
  let stations = 0;
  const uniqueIslands = new Set<string>();
  const uniqueProvinces = new Set<string>();
  const featureProperties: {
    station_id: string;
    island: string;
    province: string;
  }[] = [];

  // Convert sketch to array of features for intersection testing
  const sketchArray = toSketchArray(sketch);

  // Process each feature to check intersection and get counts/properties
  features.forEach((feature) => {
    // Check if point is in any of the sketch polygons
    const isInSketch = sketchArray.some((sketchFeature) =>
      booleanPointInPolygon(feature, sketchFeature),
    );

    if (isInSketch) {
      const props = feature.properties || {};
      if (props.station_id) stations++;
      if (props.island) uniqueIslands.add(props.island);
      if (props.province) uniqueProvinces.add(props.province);

      featureProperties.push({
        station_id: props.station_id || "",
        island: props.island || "",
        province: props.province || "",
      });
    }
  });

  // Create metrics for the counts
  const metrics: Metric[] = [
    createMetric({
      metricId: "stations",
      value: stations,
    }),
    createMetric({
      metricId: "islands",
      value: uniqueIslands.size,
    }),
    createMetric({
      metricId: "provinces",
      value: uniqueProvinces.size,
    }),
  ];

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    stations: featureProperties,
  };
}

export default new GeoprocessingHandler(sites, {
  title: "sites",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
