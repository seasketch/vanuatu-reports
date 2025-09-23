import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  LayerToggle,
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
 * LandUse component
 */
export const LandUse: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ id }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("landUse", t);

  // Labels
  const titleLabel = t("Land Use - Open Street Map");
  const descriptionLabel = t("Land Use Type");
  const withinLabel = t("Within Area");
  const unitsLabel = t("km²");
  const mapLabel = t("Show On Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="landUse" useChildCard>
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
                  <Trans i18nKey="LandUse 1">
                    This report summarizes land use within 1 km of the area of
                    interest.
                  </Trans>
                </p>

                <ClassTable
                  rows={metrics}
                  metricGroup={metricGroup}
                  columnConfig={[
                    {
                      columnLabel: descriptionLabel,
                      type: "class",
                      width: 30,
                    },
                    {
                      columnLabel: withinLabel,
                      type: "metricValue",
                      metricId: metricGroup.metricId,
                      valueFormatter: (val) =>
                        squareMeterToKilometer(Number(val)).toFixed(2),
                      valueLabel: unitsLabel,
                      chartOptions: {
                        showTitle: true,
                      },
                      width: 20,
                    },
                  ]}
                />

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "LandUse LearnMore Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="LandUse - learn more">
                    <p>
                      ℹ️ Overview: Land use nearby a marine area of interest can
                      impact runoff impacts and water quality in the area of
                      interest.
                    </p>
                    <p>🗺️ Source Data: Open Street Map</p>
                    <p>
                      📈 Report: This report calculates the total area of land
                      use within 1km of the area of interest.
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
