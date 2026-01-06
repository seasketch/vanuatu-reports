import fs from "fs-extra";
import {
  FeatureCollection,
  Nullable,
  Polygon,
} from "@seasketch/geoprocessing/client-core";

export interface OusFeatureProperties {
  resp_id: number;
  sector?: Nullable<string>;
  participants: string | number;
  represented_in_sector: string | number;
  village: string | number;
  fishing_type: string | number;
  fishing_method: string | number;
  [key: string]: any;
}

const shapeFc = fs.readJSONSync(
  "./ous_demographics.geojson",
) as FeatureCollection<Polygon, OusFeatureProperties>;

// sort by respondent_id (string)
const sortedShapes = shapeFc.features.sort(
  (a, b) => a.properties.resp_id - b.properties.resp_id,
);
fs.writeFileSync(
  "./ous_demographics_sorted.geojson",
  JSON.stringify({ ...shapeFc, features: sortedShapes }),
);
