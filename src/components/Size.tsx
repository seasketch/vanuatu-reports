import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  KeySection,
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
  firstMatchingMetric,
  flattenBySketchAllClass,
  metricsWithSketchId,
  percentWithEdge,
  roundLower,
  squareMeterToKilometer,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/**
 * Size component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const Size: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("size", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Size");
  const mapLabel = t("Map");
  const withinLabel = t("Within Area");
  const percWithinLabel = t("% Within Area");
  const unitsLabel = t("km²");

  return (
    <ResultsCard
      title={titleLabel}
      functionName="size"
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

        const areaMetric = firstMatchingMetric(
          data.metrics,
          (m) => m.sketchId === id && m.groupId === null && m.classId === "eez",
        );
        const totalAreaMetric = firstMatchingMetric(
          precalcMetrics,
          (m) => m.groupId === null && m.classId === "eez",
        );
        const areaDisplay = roundLower(
          squareMeterToKilometer(areaMetric.value),
        );
        const percDisplay = percentWithEdge(
          areaMetric.value / totalAreaMetric.value,
        );

        return (
          <ReportError>
            <p>
              <Trans i18nKey="Size 1">
                The Vanuatu Exclusive Economic Zone extends from the shoreline
                to 200 nautical miles. This report summarizes this area of
                interest's overlap with boundaries within the EEZ.
              </Trans>
            </p>

            <KeySection>
              {t("This area of interest is")}{" "}
              <b>
                {areaDisplay} {unitsLabel}
              </b>
              {", "}
              {t("which is")} <b>{percDisplay}</b> {t("of the Vanuatu EEZ.")}
            </KeySection>

            <ClassTable
              rows={metrics}
              metricGroup={metricGroup}
              objective={objectives}
              columnConfig={[
                {
                  columnLabel: t("Boundary"),
                  type: "class",
                  width: 40,
                },
                {
                  columnLabel: withinLabel,
                  type: "metricValue",
                  metricId: metricGroup.metricId,
                  valueFormatter: (v) =>
                    Number(v)
                      ? roundLower(squareMeterToKilometer(Number(v)))
                      : 0,
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
              <Trans i18nKey="Size - learn more">
                <p>Overview of maritime boundaries:</p>
                <ul>
                  <li>
                    EEZ, Exclusive Economic Zone (0-200nm, Data source: Marine
                    Regions v12)
                  </li>
                  <li>
                    Archipelagic zone: Waters enclosed by the outermost points
                    of the archipelago
                  </li>
                  <li>Territorial seas: 0-12 nm</li>
                  <li>Offshore: 6-200 nm</li>
                  <li>Intermediate MMA (Marine Managed Area): 0-6 nm</li>
                  <li>
                    Reef +100 (Inshore custom/coastal management areas): 0-100m
                    beyond reefs, including specific sites beyond that boundary
                    where communities claim stewardship and governed by
                    traditional practices.
                  </li>
                </ul>
                <p>
                  📈 Report: This report calculates the total area of the area
                  of interest within various maritime boundaries. This value is
                  divided by the total area of the maritime zones to obtain the
                  % contained within the area of interest.
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
