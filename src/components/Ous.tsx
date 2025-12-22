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
  GeogProp,
  Metric,
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/**
 * OUS component
 */
export const Ous: React.FunctionComponent<{
  printing: boolean;
  geographyId?: string;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("ous", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "sum",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Emau Ocean Use Survey");
  const classLabel = t("Ocean Use");
  const mapLabel = t("Map");
  const percWithinLabel = t("% Within Area");

  return (
    <ResultsCard title={titleLabel} functionName="ous">
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
              <Trans i18nKey="OusCard 1">
                This report summarizes this area of interest's overlap with the
                Emau Ocean Use Survey data.
              </Trans>
            </p>

            <ClassTable
              rows={metrics}
              metricGroup={metricGroup}
              columnConfig={[
                {
                  columnLabel: classLabel,
                  type: "class",
                  width: 30,
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
              <Collapse title={t("Show by Sketch")}>
                {genSketchTable(
                  data,
                  metricGroup,
                  precalcMetrics,
                  childProperties,
                )}
              </Collapse>
            )}

            <Collapse title={t("Learn More")}>
              <Trans i18nKey="OusCard - learn more">
                <p>
                  ℹ️ Overview: To capture the value each sector places on
                  different areas of the nearshore, an Ocean Use Survey was
                  conducted. Individuals identified the sectors they participate
                  in, and were asked to draw the areas they use relative to that
                  sector and assign a value of importance. Individual responses
                  were then combined to produce aggregate heatmaps by sector.
                  This allows the value of areas to be quantified, summed, and
                  compared to one another as more or less valuable.
                </p>
                <p>
                  Value is then used as a proxy for measuring the potential
                  economic loss to sectors caused by the creation of protected
                  areas. This report can be used to minimize the potential
                  impact of a plan on a sector, as well as identify and reduce
                  conflict between conservation objectives and sector
                  activities. The higher the proportion of value within the
                  plan, the greater the potential impact to the fishery if
                  access or activities are restricted.
                </p>
                <p>
                  Note, the resulting heatmaps are only representative of the
                  individuals that were surveyed.
                </p>
                <p>
                  🗺️ Methods:{" "}
                  <a
                    href="https://seasketch.github.io/python-sap-map/index.html"
                    target="_blank"
                  >
                    Spatial Access Priority Mapping Overview
                  </a>
                </p>
                <p>
                  📈 Report: Percentages are calculated by summing the areas of
                  value within the MPAs in this plan, and dividing it by all
                  ocean use value. If the plan includes multiple areas that
                  overlap, the overlap is only counted once.
                </p>
                <p>
                  This report shows the percentage of ocean use value that is
                  contained by the proposed plan.
                </p>
              </Trans>
            </Collapse>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (
  data: ReportResult,
  metricGroup: MetricGroup,
  precalcMetrics: Metric[],
  childProperties: SketchProperties[],
) => {
  const childSketchIds = childProperties
    ? childProperties.map((skp) => skp.id)
    : [];
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === metricGroup.metricId),
      childSketchIds,
    ),
    precalcMetrics,
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childProperties,
  );
  return (
    <SketchClassTable rows={sketchRows} metricGroup={metricGroup} formatPerc />
  );
};
