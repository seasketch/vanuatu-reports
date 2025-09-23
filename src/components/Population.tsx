import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  LayerToggle,
  Pill,
  ReportError,
  ResultsCard,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  GeogProp,
  ReportResult,
  metricsWithSketchId,
  squareMeterToKilometer,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/**
 * Population component
 */
export const Population: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ id }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("population", t);

  // Labels
  const titleLabel = t("Population");
  const mapLabel = t("Show On Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="population" useChildCard>
        {(data: ReportResult) => {
          const metrics = metricsWithSketchId(
            data.metrics.filter((m) => m.metricId === metricGroup.metricId),
            [id],
          );

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
                  <Trans i18nKey="Population 1">
                    This area of interest is adjacent to areas with
                  </Trans>{" "}
                  <Pill>{metrics[0].value.toLocaleString()}</Pill> {t("people")}
                  .
                </p>

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "Population LearnMore Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="Population - learn more">
                    <p>
                      ℹ️ Overview: 2020 Vanuatu Population Estimate from Vanuatu
                      Bureau of Statistics Census.
                    </p>
                    <p>
                      📈 Report: This report colelcts areas within 1 km of the
                      area of interest and sums the population of those areas.
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
