import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  KeySection,
  LayerToggle,
  Pill,
  ReportError,
  ResultsCard,
  SketchClassTableStyled,
  Table,
} from "@seasketch/geoprocessing/client-ui";
import { MetricGroup } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Station } from "../util/station.js";
import { ClassTablePrintAware } from "./ClassTablePrintAware.js";

/**
 * JuvenileCoralDensity component
 */
export const JuvenileCoralDensity: React.FunctionComponent<{
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();

  // Metrics
  const metricGroup = project.getMetricGroup("juvenileCoralDensity", t);

  // Labels
  const titleLabel = t("Juvenile Coral Density");
  const coralLabel = t("Coral Genus");
  const mapLabel = t("Map");
  const averageLabel = t("Average Coral Density");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="juvenileCoralDensity">
        {(data: Station[]) => {
          const averages = data.find((s) => s.station_id === "averages");
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
                <Trans i18nKey="JuvenileCoralDensity 1">
                  Average total juvenile coral density of{" "}
                  <Pill>{Number(averages?.total).toFixed(1)} indv/m²</Pill>
                </Trans>
              </KeySection>

              <LayerToggle
                layerId="L34FellVJ"
                label="Show Total Juvenile Coral Density On Map"
              />

              <Collapse
                title={t("Show By Coral Genus")}
                key={
                  props.printing + "JuvenileCoralDensity Coral Genus Collapse"
                }
                collapsed={!props.printing}
              >
                <ClassTablePrintAware
                  rows={averageMetrics.filter((m) => m.classId !== "total")}
                  metricGroup={metricGroup}
                  printing={props.printing}
                  columnConfig={[
                    {
                      columnLabel: coralLabel,
                      type: "class",
                      width: 20,
                    },
                    {
                      columnLabel: averageLabel,
                      type: "metricValue",
                      metricId: metricGroup.metricId,
                      valueFormatter: (val: any) => Number(val).toFixed(1),
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
              </Collapse>

              {!props.printing && (
                <Collapse title={t("Show By Station")}>
                  {genSketchTable(data, metricGroup, t)}
                </Collapse>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "JuvenileCoralDensity LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="JuvenileCoralDensity - learn more">
                  <p>
                    ℹ️ Overview: Juvenile coral density as counted in the 2023
                    Vanuatu Expedition.
                  </p>
                  <p>🗺️ Source Data: 2023 Vanuatu Expedition</p>
                  <p>
                    📈 Report: This report calculates the average coral density
                    of juvenile corals within the area of interest by averaging
                    the coral density results of individual dive sites within
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
        return row[curClass.classId];
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
