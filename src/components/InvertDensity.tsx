import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  KeySection,
  Pill,
  ReportError,
  ResultsCard,
  Skeleton,
  SketchClassTableStyled,
  Table,
} from "@seasketch/geoprocessing/client-ui";
import { MetricGroup } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Station } from "../util/station.js";

const families = ["Crustacean", "Echinoderm", "Mollusc", "Sponge", "Other"];

/**
 * InvertDensity component
 */
export const InvertDensity: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();

  // Metrics
  const metricGroup = project.getMetricGroup("invertDensity", t);

  // Labels
  const titleLabel = t("Invertebrate Density");
  const fishLabel = t("Invertebrate Family");
  const trophicLabel = t("Trophic Group");
  const mapLabel = t("Map");
  const averageLabel = t("Average Invertebrate Density");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="invertDensity">
        {(results: Station[]) => {
          if (!results || !Array.isArray(results)) {
            console.log("Results is not an array:", typeof results, results);
            return <Skeleton />;
          }
          const averages = results.find((s) => s.station_id === "averages");
          const averageMetrics = averages
            ? Object.entries(averages)
                .filter(([key]) => key !== "station_id")
                .map(([classId, value]) => ({
                  value: value as number,
                  classId,
                  metricId: metricGroup.metricId,
                  geographyId: null,
                  sketchId: null,
                  groupId: null,
                }))
            : [];

          return (
            <ReportError>
              <KeySection>
                <Trans i18nKey="InvertDensity 1">
                  Average total invertebrate density:{" "}
                  <Pill>{Number(averages?.density).toFixed(1)} indv/m²</Pill>
                </Trans>
              </KeySection>

              <Collapse
                title={t("Show By Family")}
                key={props.printing + "InvertDensity Family Collapse"}
                collapsed={!props.printing}
              >
                <ClassTable
                  rows={averageMetrics.filter((m) =>
                    families.includes(m.classId),
                  )}
                  metricGroup={metricGroup}
                  columnConfig={[
                    {
                      columnLabel: fishLabel,
                      type: "class",
                      width: 20,
                    },
                    {
                      columnLabel: averageLabel,
                      type: "metricValue",
                      metricId: metricGroup.metricId,
                      valueFormatter: (val) => Number(val).toFixed(1),
                      chartOptions: {
                        showTitle: true,
                      },
                      valueLabel: "indv/m²",
                      colStyle: { textAlign: "center" },
                      width: 50,
                    },
                    {
                      columnLabel: mapLabel,
                      type: "layerToggle",
                      width: 10,
                    },
                  ]}
                />
              </Collapse>

              {!props.printing && (
                <Collapse title={t("Show By Genus")}>
                  <ClassTable
                    rows={averageMetrics.filter(
                      (m) =>
                        m.classId !== "density" &&
                        !families.includes(m.classId),
                    )}
                    metricGroup={metricGroup}
                    columnConfig={[
                      {
                        columnLabel: trophicLabel,
                        type: "class",
                        width: 30,
                      },
                      {
                        columnLabel: averageLabel,
                        type: "metricValue",
                        metricId: metricGroup.metricId,
                        valueFormatter: (val) => Number(val).toFixed(1),
                        chartOptions: {
                          showTitle: true,
                        },
                        valueLabel: "indv/m²",
                        colStyle: { textAlign: "center" },
                        width: 40,
                      },
                      {
                        columnLabel: mapLabel,
                        type: "layerToggle",
                        width: 10,
                      },
                    ]}
                  />
                </Collapse>
              )}

              {!props.printing && (
                <Collapse title={t("Show By Station")}>
                  {genSketchTable(results, metricGroup, t)}
                </Collapse>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "InvertDensity LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="InvertDensity - learn more">
                  <p>
                    ℹ️ Overview: Total invertebrate density, by site, from the
                    2023 Vanuatu expedition.
                  </p>
                  <p>🗺️ Source Data: 2023 Vanuatu Expedition</p>
                  <p>
                    📈 Report: This report calculates the average invertebrate
                    density within the area of interest by averaging the
                    invertebrate density results of individual dive sites within
                    the area.
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

const genSketchTable = (data: Station[], metricGroup: MetricGroup, t: any) => {
  const stationLabel = t("Station ID");
  const stations = data.filter((s) => s.station_id !== "averages");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return Number(row[curClass.classId]).toFixed(1);
      },
      style: { textAlign: "center" },
    }));

  const columns: Column<Record<string, string | number>>[] = [
    {
      Header: stationLabel,
      accessor: (row) => {
        return <div style={{ width: 80 }}>{row.station_id}</div>;
      },
    },
    ...(classColumns as Column<any>[]),
  ];

  return (
    <SketchClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={stations.sort((a, b) =>
          (a.station_id as string).localeCompare(b.station_id as string),
        )}
      />
    </SketchClassTableStyled>
  );
};
