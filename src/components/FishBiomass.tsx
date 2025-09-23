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

const trophicGroups = [
  "Herbivore/Detritivore",
  "Lower-carnivore",
  "Planktivore",
  "Shark",
  "Top-predator",
];

/**
 * FishBiomass component
 */
export const FishBiomass: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();

  // Metrics
  const metricGroup = project.getMetricGroup("fishBiomass", t);

  // Labels
  const titleLabel = t("Fish Biomass");
  const fishLabel = t("Fish Family");
  const trophicLabel = t("Trophic Group");
  const mapLabel = t("Map");
  const averageLabel = t("Average Fish Biomass");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="fishBiomass">
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
                <Trans i18nKey="FishBiomass 1">
                  This area has an average total fish biomass of{" "}
                  <Pill>
                    {Number(averages?.toal_fish_biomass).toFixed(1)} g/m²
                  </Pill>
                </Trans>
              </KeySection>

              <LayerToggle
                layerId="rNFcihFlN"
                label="Show Total Fish Biomass On Map"
              />

              <Collapse
                title={t("Show By Family")}
                key={props.printing + "FishBiomass Family Collapse"}
                collapsed={!props.printing}
              >
                <ClassTablePrintAware
                  rows={averageMetrics.filter(
                    (m) =>
                      m.classId !== "toal_fish_biomass" &&
                      !trophicGroups.includes(m.classId),
                  )}
                  metricGroup={metricGroup}
                  printing={props.printing}
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
                      valueFormatter: (val: any) => Number(val).toFixed(1),
                      chartOptions: {
                        showTitle: true,
                      },
                      valueLabel: "g/m²",
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

              <Collapse
                title={t("Show By Trophic Group")}
                key={props.printing + "FishBiomass Trophic Group Collapse"}
                collapsed={!props.printing}
              >
                <ClassTable
                  rows={averageMetrics.filter((m) =>
                    trophicGroups.includes(m.classId),
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
                      valueLabel: "g/m²",
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

              {!props.printing && (
                <Collapse title={t("Show By Station")}>
                  {genSketchTable(data, metricGroup, t)}
                </Collapse>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "FishBiomass LearnMore Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="FishBiomass - learn more">
                  <p>
                    ℹ️ Overview: Total fish biomass, by site, from the 2023
                    Vanuatu expedition.
                  </p>
                  <p>🗺️ Source Data: 2023 Vanuatu Expedition</p>
                  <p>
                    📈 Report: This report calculates the average fish biomass
                    within the area of interest by averaging the fish biomass
                    results of individual dive sites within the area.
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
