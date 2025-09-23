import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  LayerToggle,
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
 * GeomorphACA component
 */
export const GeomorphACA: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyByGroup("default-boundary")[0];

  // Metrics
  const metricGroup = project.getMetricGroup("geomorphACA", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Geomorphology - Allen Coral Atlas");
  const withinLabel = t("Within Area");
  const percWithinLabel = t("% Within Area");
  const unitsLabel = t("km²");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="geomorphACA"
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
                <Trans i18nKey="GeomorphACA 1">
                  This report summarizes this zone&apos;s overlap with
                  geomorphic features within Vanuatu's EEZ, based on Allen Coral
                  Atlas data.
                </Trans>
              </p>

              <LayerToggle
                layerId={metricGroup.layerId}
                label={t("Show Geomorphic Features On Map")}
              />

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                objective={objectives}
                columnConfig={[
                  {
                    columnLabel: "Geomorphic Feature",
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
                  key={props.printing + "GeomorphACA MPA Collapse"}
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
                key={props.printing + "GeomorphACA LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="GeomorphACA - learn more">
                  <p>
                    ℹ️ Overview: The Allen Coral Atlas is a global-scale coral
                    reef habitat mapping project that is using Planet Dove 3.7m
                    resolution daily satellite imagery (in combination with wave
                    models and ecological data) to create consistent global
                    coral reef habitat maps with the purpose of supporting
                    science and conservation.
                  </p>
                  <p>
                    📈 Report: This report calculates the total area of each
                    geomorphic feature within the zone. This value is divided by
                    the total area of each geomorphic feature to obtain the %
                    contained within the zone.
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
