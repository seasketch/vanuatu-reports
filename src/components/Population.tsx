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
  ReportResult,
  metricsWithSketchId,
  percentWithEdge,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

const popMap = {
  TAFEA: 45974,
  SHEFA: 105888,
  PENAMA: 35633,
  MALAMPA: 43108,
  SANMA: 61564,
  TORBA: 11457,
};
const totalPopulation = Object.values(popMap).reduce(
  (acc, curr) => acc + curr,
  0,
);

// Create precalcMetrics from popMap data
const precalcMetrics = Object.entries(popMap).map(([classId, value]) => ({
  geographyId: null,
  metricId: "population",
  classId: classId,
  sketchId: null,
  groupId: null,
  value: value,
}));

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
          const percMetricIdName = `${metricGroup.metricId}Perc`;
          const valueMetrics = metricsWithSketchId(
            data.metrics.filter((m) => m.metricId === metricGroup.metricId),
            [id],
          );

          const percentMetrics = toPercentMetric(valueMetrics, precalcMetrics, {
            metricIdOverride: percMetricIdName,
          });
          const metrics = [...valueMetrics, ...percentMetrics];

          const totalPop = valueMetrics.reduce(
            (acc, curr) => acc + curr.value,
            0,
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
                  <Pill>{totalPop.toLocaleString()}</Pill> {t("people")}, or{" "}
                  <Pill>~{percentWithEdge(totalPop / totalPopulation)}</Pill>{" "}
                  {t("of Vanuatu's 2020 population")}.
                </p>

                <Collapse
                  title={t("Show by Province")}
                  key={props.printing + "Province Collapse"}
                  collapsed={!props.printing}
                >
                  <ClassTable
                    rows={metrics}
                    metricGroup={metricGroup}
                    columnConfig={[
                      {
                        columnLabel: t("Province"),
                        type: "class",
                        width: 30,
                      },
                      {
                        columnLabel: "Population",
                        type: "metricValue",
                        metricId: metricGroup.metricId,
                        valueFormatter: "integer",
                        chartOptions: {
                          showTitle: true,
                        },
                        width: 20,
                      },
                      {
                        columnLabel: "% of Province Population",
                        type: "metricChart",
                        metricId: percMetricIdName,
                        valueFormatter: "percent",
                        chartOptions: {
                          showTitle: true,
                        },
                        width: 40,
                      },
                    ]}
                  />
                </Collapse>

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
                      📈 Report: This report colelcts areas within 0.5 km of the
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
