import React from "react";
import {
  ResultsCard,
  KeySection,
  Collapse,
  ToolbarCard,
  useSketchProperties,
  LayerToggle,
  VerticalSpacer,
  SketchClassTable,
} from "@seasketch/geoprocessing/client-ui";
import { BathymetryResults } from "../functions/bathymetry.js";
import { Trans, useTranslation } from "react-i18next";
import projectClient from "../../project/projectClient.js";
import { MetricGroup } from "@seasketch/geoprocessing";

const formatBathymetry = (val: number) => {
  if (!val || val > 0) return "0m";
  const baseVal = Math.round(Math.abs(val));
  return `-${baseVal}m`;
};

export const Bathymetry: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const mg = projectClient.getMetricGroup("bathymetry", t);
  const mapLabel = t("Show On Map");
  const title = t("Bathymetry");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={title} functionName="bathymetry" useChildCard>
        {(data: BathymetryResults[]) => {
          const overallStats = isCollection
            ? data.find((s) => s.isCollection)
            : data[0];

          return (
            <ToolbarCard
              title={title}
              items={[
                <LayerToggle layerId={mg.layerId} label={mapLabel} simple />,
              ]}
            >
              <VerticalSpacer />
              <KeySection
                style={{ display: "flex", justifyContent: "space-around" }}
              >
                <span>
                  {t("Min")}:{" "}
                  <b>
                    {overallStats
                      ? formatBathymetry(overallStats.max)
                      : t("N/A")}
                  </b>
                </span>
                {overallStats && overallStats?.mean ? (
                  <span>
                    {t("Avg")}: <b>{formatBathymetry(overallStats.mean)}</b>
                  </span>
                ) : (
                  <></>
                )}
                <span>
                  {t("Max")}:{" "}
                  <b>
                    {overallStats
                      ? formatBathymetry(overallStats.min)
                      : t("N/A")}
                  </b>
                </span>
              </KeySection>

              {isCollection && (
                <Collapse title={t("Show by MPA")}>
                  {genBathymetryTable(data, mg)}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="Bathymetry Card - Learn more">
                  <p>🗺️ Source Data: GEBCO 2024</p>
                  <p>
                    📈 Report: Calculates the minimum, average, and maximum
                    ocean Bathymetry within the zone.
                  </p>
                </Trans>
              </Collapse>
            </ToolbarCard>
          );
        }}
      </ResultsCard>
    </div>
  );
};

export const genBathymetryTable = (
  data: BathymetryResults[],
  mg: MetricGroup,
) => {
  const sketchMetrics = data.filter((s) => !s.isCollection);

  const rows = sketchMetrics.map((metric) => ({
    sketchName: metric.sketchName!,
    min: formatBathymetry(metric.max),
    mean: formatBathymetry(metric.mean!),
    max: formatBathymetry(metric.min),
  }));

  return <SketchClassTable rows={rows} metricGroup={mg} />;
};
