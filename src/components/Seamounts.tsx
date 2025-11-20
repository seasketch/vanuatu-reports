import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  ReportError,
  ResultsCard,
  SketchClassTable,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import precalcMetrics from "../../data/precalc/precalcSeamounts.json" with { type: "json" };

/**
 * Seamounts report
 */
export const Seamounts: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("seamounts", t);

  // Labels
  const titleLabel = t("Seamounts");
  const mapLabel = t("Map");
  const withinLabel = t("Within Plan");
  const percWithinLabel = t("% Within Plan");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="seamounts">
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

          return (
            <ReportError>
              <p>
                <Trans i18nKey="Seamounts 1">
                  This report summarizes the number of seamounts within the area
                  of interest.
                </Trans>
              </p>

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: " ",
                    type: "class",
                    width: 30,
                  },
                  {
                    columnLabel: withinLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: "integer",
                    chartOptions: {
                      showTitle: true,
                    },
                    width: 20,
                  },
                  {
                    columnLabel: percWithinLabel,
                    type: "metricChart",
                    metricId: percMetricIdName,
                    valueFormatter: "percent",
                    chartOptions: {
                      showTitle: true,
                    },
                    width: 40,
                  },
                  {
                    columnLabel: mapLabel,
                    type: "layerToggle",
                    width: 10,
                  },
                ]}
              />

              {isCollection && childProperties && (
                <Collapse
                  title={t("Show by Sketch")}
                  key={props.printing + "Seamounts MPA Collapse"}
                  collapsed={!props.printing}
                >
                  {genSketchTable(data, metricGroup, childProperties)}
                </Collapse>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "Seamounts LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="Seamounts - learn more">
                  <p>
                    Source data:{" "}
                    <a
                      href="https://doi.org/10.14324/111.444/ucloe.000030"
                      target="_blank"
                    >
                      Yesson et al. 2021
                    </a>
                  </p>
                  <p>
                    📈 Report: This report calculates the total number of
                    seamounts within the area of interest. This value is divided
                    by the total number of seamounts to obtain the % contained
                    within the area of interest.
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

const genSketchTable = (
  data: ReportResult,
  metricGroup: MetricGroup,
  childProperties: SketchProperties[],
) => {
  const childSketchIds = childProperties
    ? childProperties.map((skp) => skp.id)
    : [];
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketchMetrics = metricsWithSketchId(
    data.metrics.filter((m) => m.metricId === metricGroup.metricId),
    childSketchIds,
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childProperties,
  );
  return <SketchClassTable rows={sketchRows} metricGroup={metricGroup} />;
};
