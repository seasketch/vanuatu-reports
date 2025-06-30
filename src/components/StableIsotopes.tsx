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
  percentWithEdge,
  ReportResult,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

interface IsotopeReportResult extends ReportResult {
  stations: {
    station_id: string;
    ratio: number;
  }[];
}

/**
 * StableIsotopes component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const StableIsotopes: React.FunctionComponent = () => {
  const { t } = useTranslation();

  // Metrics
  const metricGroup = project.getMetricGroup("isotopes", t);

  // Labels
  const titleLabel = t("Stable Isotopes");
  const withinLabel = t("Average Within Plan");
  const mapLabel = t("Map");

  return (
    <ResultsCard title={titleLabel} functionName="isotopes">
      {(data: IsotopeReportResult) => {
        const metrics = data.metrics;

        return (
          <ReportError>
            <p>
              <Trans i18nKey="StableIsotopes 1">
                Poor water quality can stress reefs by causing macroalgal
                blooms, promoting coral disease, and increasing bioerosion. This
                report estimates the percentage of Nitrogen-15 within the area
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
                  valueFormatter: (value) => percentWithEdge(Number(value)),
                  chartOptions: {
                    showTitle: true,
                  },
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

            <Collapse title={t("Show By Station")}>
              {genSketchTable(data, metricGroup, t)}
            </Collapse>

            <Collapse title={t("Learn More")}>
              <Trans i18nKey="StableIsotopes - learn more">
                <p>🗺️ Source Data: 2023 Vanuatu Expedition</p>
                <p>
                  📈 Report: This report calculates the average percentage of
                  Nitrogen-15 in the area of interest by averaging the
                  percentage of Nitrogen-15 of individual dive sites within the
                  area.
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
  data: IsotopeReportResult,
  metricGroup: MetricGroup,
  t: any,
) => {
  const stationLabel = t("Station ID");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return percentWithEdge(Number(row["ratio"]));
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
        data={data.stations.sort((a, b) =>
          (a.station_id as string).localeCompare(b.station_id as string),
        )}
      />
    </SketchClassTableStyled>
  );
};
