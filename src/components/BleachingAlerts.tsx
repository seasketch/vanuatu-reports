import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  PointyCircle,
  ReportError,
  ResultsCard,
  ToolbarCard,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";
import projectClient from "../../project/projectClient.js";

const displayMap: Record<string, string> = {
  0: "No Stress",
  1: "Bleaching Watch",
  2: "Bleaching Warning",
  3: "Bleaching Alert Level 1",
  4: "Bleaching Alert Level 2",
  5: "Bleaching Alert Level 3",
  6: "Bleaching Alert Level 4",
  7: "Bleaching Alert Level 5",
};

const colorMap: Record<string, string> = {
  0: "#C8FAFA",
  1: "#FFF000",
  2: "#FAAA0A",
  3: "#F00000",
  4: "#960000",
  5: "#A05024",
  6: "#F000F0",
  7: "#6E006E",
};

/**
 * Bleaching Alerts component
 */
export const BleachingAlerts: React.FunctionComponent = () => {
  const { t } = useTranslation();

  // Labels
  const titleLabel = t("Bleaching Alert Areas (2024)");
  const mapLabel = t("Show On Map");
  const metricGroup = projectClient.getMetricGroup("bleachingAlerts");

  return (
    <ResultsCard title={titleLabel} functionName="bleachingAlerts" useChildCard>
      {(data: ReportResult) => {
        return (
          <ToolbarCard
            title={titleLabel}
            items={
              <LayerToggle
                label={mapLabel}
                layerId={metricGroup.layerId}
                simple
              />
            }
          >
            <ReportError>
              <p>
                <Trans i18nKey="BleachingAlerts 1">
                  In 2024, this area of interest contained areas of:
                </Trans>
              </p>

              {data.metrics.map((m) =>
                m.value ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "5px",
                    }}
                  >
                    <div style={{ paddingRight: 10 }}>
                      <PointyCircle color={colorMap[m.classId!]} size={18}>
                        {null}
                      </PointyCircle>
                    </div>
                    <div style={{ fontSize: 18 }}>{displayMap[m.classId!]}</div>
                  </div>
                ) : (
                  <></>
                ),
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="BleachingAlerts - learn more">
                  <p>
                    ℹ️ Overview: The NOAA Coral Reef Watch (CRW) coral bleaching
                    Bleaching Alert Area (BAA) values are coral bleaching heat
                    stress levels. In the annual product, each pixel is given
                    its maximum alert warning from 2024.
                  </p>
                  <p>
                    Bleaching Alert levels: No Stress; Bleaching Watch;
                    Bleaching Warning; Bleaching Alert Level 1; Bleaching Alert
                    Level 2; Bleaching Alert Level 3; Bleaching Alert Level 4;
                    Bleaching Alert Level 5.
                  </p>
                  <p>🗺️ Source Data: NOAA Coral Reef Watch</p>
                  <p>
                    📈 Report: This report summarizes the varying Bleaching
                    Alert Areas within the area of interest.
                  </p>
                </Trans>
              </Collapse>
            </ReportError>
          </ToolbarCard>
        );
      }}
    </ResultsCard>
  );
};
