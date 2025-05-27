import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  Pill,
  ReportError,
  ResultsCard,
  SmallReportTableStyled,
  Table,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";

interface SiteReportResult extends ReportResult {
  stations: {
    station_id: string;
    island: string;
    province: string;
  }[];
}

/**
 * Sites component
 *
 * @param props - geographyId
 * @returns A react component which displays station data
 */
export const Sites: React.FunctionComponent = () => {
  const { t } = useTranslation();

  // Labels
  const titleLabel = t("Stations");

  return (
    <ResultsCard title={titleLabel} functionName="sites">
      {(data: SiteReportResult) => {
        console.log(data);
        // Get metric values
        const stations =
          data.metrics.find((m) => m.metricId === "stations")?.value || 0;
        const islands =
          data.metrics.find((m) => m.metricId === "islands")?.value || 0;
        const provinces =
          data.metrics.find((m) => m.metricId === "provinces")?.value || 0;

        return (
          <ReportError>
            <p>
              <Trans i18nKey="Sites 1">
                This plan contains <Pill>{stations.toString()}</Pill> station
                {stations > 1 ? "s" : ""} in <Pill>{islands.toString()}</Pill>{" "}
                island{islands > 1 ? "s" : ""} and{" "}
                <Pill>{provinces.toString()}</Pill> province
                {provinces > 1 ? "s" : ""}.
              </Trans>
            </p>

            <LayerToggle
              layerId="snBC9o_nH"
              label={t("Show Stations on Map")}
            />

            <Collapse title={t("Stations")}>
              <SmallReportTableStyled>
                <Table
                  data={data.stations}
                  columns={[
                    {
                      Header: t("Station ID"),
                      accessor: "station_id",
                    },
                    {
                      Header: t("Island"),
                      accessor: "island",
                    },
                    {
                      Header: t("Province"),
                      accessor: "province",
                    },
                  ]}
                />
              </SmallReportTableStyled>
            </Collapse>

            <Collapse title={t("Learn More")}>
              <Trans i18nKey="Sites - learn more">
                <p>
                  ℹ️ Overview: This report shows the number of stations,
                  islands, and provinces that overlap with your plan area.
                </p>
                <p>
                  🗺️ Source Data: The data comes from the sites dataset which
                  contains information about sampling stations across Vanuatu.
                </p>
              </Trans>
            </Collapse>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};
