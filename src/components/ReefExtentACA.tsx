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
 * ReefExtentACA component
 */
export const ReefExtentACA: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyByGroup("default-boundary")[0];

  // Metrics
  const metricGroup = project.getMetricGroup("reefExtentACA", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Reef Extent - Allen Coral Atlas");
  const mapLabel = t("Map");
  const withinLabel = t("Within Area");
  const percWithinLabel = t("% Within Area");
  const unitsLabel = t("km²");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="reefExtentACA"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
      >
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

          const objectives = (() => {
            const objectives = project.getMetricGroupObjectives(metricGroup, t);
            if (objectives.length) {
              return objectives;
            } else {
              return;
            }
          })();

          return (
            <ReportError>
              <p>
                <Trans i18nKey="ReefExtentACA 1">
                  This report summarizes reef extent within the area of
                  interest, based on Allen Coral Atlas data.
                </Trans>
              </p>

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                objective={objectives}
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
                  key={props.printing + "ReefExtentACA MPA Collapse"}
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
                key={props.printing + "ReefExtentACA LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="ReefExtentACA - learn more">
                  <p>
                    ℹ️ Overview: The Allen Coral Atlas is a global-scale coral
                    reef habitat mapping project that uses Planet Dove 3.7 m
                    resolution daily satellite imagery (in combination with wave
                    models and ecological data) to create consistent and high-
                    detail global habitat maps to support reef-related science
                    and conservation. The reef extent layer more inclusively
                    depicts the shallow coral reef environment than our more
                    detailed benthic or geomorphic habitat maps. It includes
                    reef features that were unmappable to geomorphic/benthic
                    level, including deeper reef structures, reef habitat in
                    more turbid water, deep or very steep reef slope areas, and
                    very shallow intertidal areas at the land-sea interface.
                    Known limitations are that some areas of supra-tidal beach
                    and vegetation are included, which may not strictly be coral
                    reef environments. Overall, the reef extent product is still
                    conservative, and we expect that the area of reef
                    erroneously included at the land-sea interface is greatly
                    outweighed by the areas of reef still missed at both the
                    shallow and deep margins of the product.
                  </p>
                  <p>
                    📈 Report: This report calculates the total area of reef
                    extent within the zone. This value is divided by the total
                    area of reef extent to obtain the % contained within the
                    zone.
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
