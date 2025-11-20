import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  LayerToggle,
  ReportError,
  ResultsCard,
  Skeleton,
  SketchClassTable,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  Metric,
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  squareMeterToKilometer,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/**
 * Benthic Map Allen Coral Atlas Overlap
 */
export const BenthicACA: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyByGroup("default-boundary")[0];

  // Metrics
  const metricGroup = project.getMetricGroup("benthicACA", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Benthic Map - Allen Coral Atlas");
  const withinLabel = t("Within Area");
  const percWithinLabel = t("% Within Area");
  const unitsLabel = t("km²");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="benthicACA">
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
                <Trans i18nKey="BenthicACA 1">
                  This report summarizes benthic features within the area of
                  interest, based on Allen Coral Atlas data.
                </Trans>
              </p>

              <LayerToggle
                layerId={metricGroup.layerId}
                label={t("Show Benthic Features On Map")}
              />

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: t("Benthic Feature"),
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
                ]}
              />

              {isCollection && childProperties && (
                <Collapse
                  title={t("Show by Sketch")}
                  key={props.printing + "BenthicACA MPA Collapse"}
                  collapsed={!props.printing}
                >
                  {genSketchTable(
                    data,
                    metricGroup,
                    precalcMetrics,
                    childProperties,
                  )}
                </Collapse>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "BenthicACA LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="BenthicACA - learn more">
                  <p>
                    ℹ️ Overview: The Allen Coral Atlas is a global-scale coral
                    reef habitat mapping project that uses Planet Dove 3.7 m
                    resolution daily satellite imagery (in combination with wave
                    models and ecological data) to create consistent and high-
                    detail global habitat maps to support reef-related science
                    and conservation. Global Benthic Habitat Maps characterise
                    different coral reef bottom types. These bottom types
                    include communities of living organisms attached to the reef
                    (benthos), as well as sediments and underlying substrate.
                  </p>
                  <p>
                    📈 Report: This report calculates the total area of each
                    benthic feature within the area of interest. This value is
                    divided by the total area of each benthic feature to obtain
                    the % contained within the area of interest.
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
