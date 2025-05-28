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
  Point,
  ReportResult,
  createMetric,
  rekeyMetrics,
  sortMetrics,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import { booleanPointInPolygon } from "@turf/turf";

interface RichnessProperties {
  station_id?: string;
  coral_genus_richness?: number;
  fish_family_richness?: number;
  invertebrate_species_richness?: number;
}

interface RichnessReportResult extends ReportResult {
  stations: {
    station_id: string;
    coral_genus_richness: number;
    fish_family_richness: number;
    invertebrate_species_richness: number;
  }[];
}

/**
 * richness: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function richness(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<RichnessReportResult> {
  const sketchArray = toSketchArray(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("richness");
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
        const features = (await getFeaturesForSketchBBoxes(
          sketch,
          url,
        )) as Feature<Point, RichnessProperties>[];
        const finalFeatures = features.filter((feature) =>
          sketchArray.some((sk) => booleanPointInPolygon(feature, sk)),
        );

        const propName = curClass.classId as keyof RichnessProperties;
        const classValues = finalFeatures.map(
          (feature) => feature.properties[propName] as number,
        );

        const average =
          classValues.reduce((sum, value) => sum + value, 0) /
          classValues.length;

        return {
          metric: createMetric({
            metricId: metricGroup.metricId,
            classId: curClass.classId,
            value: average,
          }),
          stations: finalFeatures.map((feature) => ({
            station_id: feature.properties.station_id!,
            [propName]: feature.properties[propName] as number,
          })),
        };
      }),
    )
  ).flat();

  // Combine all stations and merge their properties
  const stations: RichnessReportResult["stations"] = [];
  metrics.forEach(({ stations: classStations }) => {
    classStations.forEach((station) => {
      const existingStation = stations.find(
        (s) => s.station_id === station.station_id,
      );
      if (existingStation) {
        Object.assign(existingStation, station);
      } else {
        const { station_id, ...stationData } = station;
        stations.push({
          station_id,
          coral_genus_richness: 0,
          fish_family_richness: 0,
          invertebrate_species_richness: 0,
          ...stationData,
        });
      }
    });
  });

  return {
    metrics: sortMetrics(rekeyMetrics(metrics.map((m) => m.metric))),
    stations,
  };
}

export default new GeoprocessingHandler(richness, {
  title: "richness",
  description: "richness",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
