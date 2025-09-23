import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  ReportError,
  ResultsCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  GeogProp,
  metricsWithSketchId,
  ReportResult,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import projectClient from "../../project/projectClient.js";
import { GfwLineChart } from "./GfwLineChart.js";

/**
 * Gfw component
 */
export const Gfw: React.FunctionComponent<{ printing: boolean }> = (props) => {
  const { t } = useTranslation();
  const [{ id }] = useSketchProperties();
  const curGeography = projectClient.getGeographyByGroup("default-boundary")[0];

  // Labels
  const titleLabel = t("Fishing Effort - Global Fishing Watch");
  const mapLabel = t("Show Fishing Effort 2024 On Map");

  const metricGroup = projectClient.getMetricGroup("gfw");
  const precalcMetrics = projectClient.getPrecalcMetrics(
    metricGroup,
    "sum",
    curGeography.geographyId,
  );

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="gfw">
        {(data: ReportResult) => {
          const percMetricIdName = `${metricGroup.metricId}Perc`;

          const valueMetrics = metricsWithSketchId(
            data.metrics.filter((m) => m.metricId === metricGroup.metricId),
            [id],
          );
          const percentMetrics = toPercentMetric(valueMetrics, precalcMetrics, {
            metricIdOverride: percMetricIdName,
          });

          const percentLineData = percentMetrics.map((m) => ({
            year: Number(m.classId),
            value: m.value,
          }));

          return (
            <ReportError>
              <p>
                <Trans i18nKey="Gfw 1">
                  This report summarizes the percentage of fishing effort
                  contained within this area of interest from 2018-2024, based
                  on data from Global Fishing Watch.
                </Trans>
              </p>

              <LayerToggle
                label={mapLabel}
                layerId={
                  metricGroup.classes.find(
                    (curClass) => curClass.classId === "2024",
                  )?.layerId
                }
              />

              {data.metrics.some((d) => d.value !== 0) ? (
                <GfwLineChart data={percentLineData} />
              ) : (
                <p
                  style={{
                    color: "#888",
                    fontStyle: "italic",
                    margin: "20px 0",
                  }}
                >
                  No fishing effort in area of interest
                </p>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "Gfw LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="Gfw - learn more">
                  <p>
                    ℹ️ Overview: Global Fishing Watch's apparent fishing effort
                    is based on transmissions broadcast using the automatic
                    identification system (AIS). After identifying fishing
                    vessels and detecting fishing positions in the AIS data,
                    apparent fishing effort is calculated for any area by
                    summarizing the fishing hours for all fishing vessels in
                    that area.
                  </p>
                  <p>🗺️ Source Data: Global Fishing Watch</p>
                  <p>
                    📈 Report: This report calculates the sum of apparent
                    fishing effort within the area of interest. This value is
                    divided by the total sum of apparent fishing effort to
                    obtain the % contained within the area of interest.
                  </p>
                </Trans>
              </Collapse>
            </ReportError>
          );
        }}
      </ResultsCard>
    </div>
  );
};
