import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  ReportError,
  ResultsCard,
  SketchClassTableStyled,
  Table,
} from "@seasketch/geoprocessing/client-ui";
import {
  MetricGroup,
  ReportResult,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

interface RichnessReportResult extends ReportResult {
  stations: {
    station_id: string;
    coral_genus_richness: number;
    fish_family_richness: number;
    invertebrate_species_richness: number;
  }[];
}

/**
 * Richness component
 */
export const Richness: React.FunctionComponent = () => {
  const { t } = useTranslation();

  // Metrics
  const metricGroup = project.getMetricGroup("richness", t);

  // Labels
  const titleLabel = t("Richness");
  const mapLabel = t("Map");
  const withinLabel = t("Richness");

  return (
    <ResultsCard title={titleLabel} functionName="richness">
      {(data: RichnessReportResult) => {
        return (
          <ReportError>
            <p>
              <Trans i18nKey="Richness 1">
                This report summarizes the richness of coral genera, fish
                families, and invertebrate species within the area of interest.
              </Trans>
            </p>

            <ClassTable
              rows={data.metrics}
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
                  valueFormatter: (val) => Number(val).toFixed(2),
                  chartOptions: {
                    showTitle: true,
                  },
                  width: 20,
                },
                {
                  columnLabel: mapLabel,
                  type: "layerToggle",
                  width: 10,
                },
              ]}
            />

            <Collapse title={t("Show By Station")}>
              {genSketchTable(data, metricGroup, t)}
            </Collapse>

            <Collapse title={t("Learn More")}>
              <Trans i18nKey="Richness - learn more">
                <p>
                  ℹ️ Overview: This report summarizes the richness of coral
                  genera, fish families, and invertebrate species within the
                  area of interest.
                </p>
                <p>🗺️ Source Data: 2023 Vanuatu Expedition</p>
                <p>
                  📈 Report: This report calculates the average richness of
                  coral genera, fish families, and invertebrate species within
                  the area of interest by averaging the richness results of
                  individual dive sites within the area.
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
  data: RichnessReportResult,
  metricGroup: MetricGroup,
  t: any,
) => {
  const stationLabel = t("Station ID");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return row[curClass.classId];
      },
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
        data={data.stations.sort((a, b) =>
          (a.station_id as string).localeCompare(b.station_id as string),
        )}
      />
    </SketchClassTableStyled>
  );
};
