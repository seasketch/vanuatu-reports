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

interface BenthicReportResult extends ReportResult {
  stations: {
    station_id: string;
    CCA: number;
    "Calcified Macroalgae": number;
    "Hard Coral": number;
    Invertebrate: number;
    Macroalgae: number;
    Other: number;
    "Soft Coral": number;
    Turf: number;
  }[];
}

/**
 * Benthic Cover - expedition report
 */
export const BenthicCover: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();

  // Metrics
  const metricGroup = project.getMetricGroup("benthicCover", t);

  // Labels
  const titleLabel = t("Benthic Cover");
  const withinLabel = t("Average Within Area");
  const mapLabel = t("Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="benthicCover">
        {(data: BenthicReportResult) => {
          const metrics = data.metrics;

          return (
            <ReportError>
              <p>
                <Trans i18nKey="BenthicCover 1">
                  This report estimates the percentage of benthic habitats
                  within this area of interest.
                </Trans>
              </p>

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: titleLabel,
                    type: "class",
                    width: 30,
                  },
                  {
                    columnLabel: withinLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: (value) =>
                      (typeof value === "number" ? value.toFixed(2) : value) +
                      "%",
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

              {!props.printing && (
                <Collapse title={t("Show By Station")}>
                  {genSketchTable(data, metricGroup, t)}
                </Collapse>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "BenthicCover LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="BenthicCover - learn more">
                  <p>
                    🗺️ Source Data: Percentage of benthic cover per site. There
                    are 25 points per image, ~13-15 images per transect, and 3
                    transects per site.
                  </p>
                  <p>
                    📈 Report: This report collects the percent of each benthic
                    cover at each site within the area of interest. It then
                    caluclates the average percent cover of each benthic habitat
                    type.
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
  data: BenthicReportResult,
  metricGroup: MetricGroup,
  t: any,
) => {
  const stationLabel = t("Station ID");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return row[curClass.classId] + "%";
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
