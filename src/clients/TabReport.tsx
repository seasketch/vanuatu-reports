import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
} from "@seasketch/geoprocessing/client-ui";
import Translator from "../components/TranslatorAsync.js";
import { Sites } from "../components/Sites.js";
import { Size } from "../components/Size.js";
import { BenthicCover } from "../components/BenthicCover.js";
import { Richness } from "../components/Richness.js";
import { JuvenileCoralDensity } from "../components/JuvenileCoralDensity.js";
import { BenthicACA } from "../components/BenthicACA.js";
import { Bathymetry } from "../components/Bathymetry.js";

const enableAllTabs = false;
const BaseReport = () => {
  const { t } = useTranslation();
  const segments = [
    { id: "OVERVIEW", label: t("Overview") },
    { id: "EXPEDITION", label: t("Expedition Data") },
  ];
  const [tab, setTab] = useState<string>("OVERVIEW");

  return (
    <>
      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={segments}
        />
      </div>
      <ReportPage hidden={!enableAllTabs && tab !== "OVERVIEW"}>
        <Size />
        <Bathymetry />
        <BenthicACA />
        <SketchAttributesCard autoHide />
      </ReportPage>
      <ReportPage hidden={!enableAllTabs && tab !== "EXPEDITION"}>
        <Sites />
        <BenthicCover />
        <Richness />
        <JuvenileCoralDensity />
      </ReportPage>
    </>
  );
};

// Named export loaded by storybook
export const TabReport = () => {
  return (
    <Translator>
      <BaseReport />
    </Translator>
  );
};

// Default export lazy-loaded by production ReportApp
export default TabReport;
