import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  Pill,
  ReportError,
  ResultsCard,
  ToolbarCard,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/**
 * Waterways component
 */
export const Waterways: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();

  // Metrics
  const metricGroup = project.getMetricGroup("waterways", t);

  // Labels
  const titleLabel = t("Waterways - Open Street Map");
  const mapLabel = t("Show On Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="waterways" useChildCard>
        {(data: ReportResult) => {
          const metric = data.metrics[0];

          return (
            <ToolbarCard
              title={titleLabel}
              items={
                <LayerToggle
                  label={mapLabel}
                  layerId={metricGroup.layerId}
                  simple
                />
              }
            >
              <ReportError>
                <p>
                  This area of interest is within 1 km of{" "}
                  <Pill>{metric.value}</Pill> waterways.
                </p>

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "Waterways LearnMore Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="Waterways - learn more">
                    <p>
                      ℹ️ Overview: Waterways nearby a marine area of interest
                      can impact runoff and water quality in the area of
                      interest.
                    </p>
                    <p>🗺️ Source Data: Open Street Map</p>
                    <p>
                      📈 Report: This report calculates the total number of
                      waterways within 1km of the area of interest.
                    </p>
                  </Trans>
                </Collapse>
              </ReportError>
            </ToolbarCard>
          );
        }}
      </ResultsCard>
    </div>
  );
};
