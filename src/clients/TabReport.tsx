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

const enableAllTabs = false;
const BaseReport = () => {
  const { t } = useTranslation();
  const segments = [{ id: "OVERVIEW", label: t("Overview") }];
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
        <Sites />
        <BenthicCover />
        <Richness />
        <SketchAttributesCard autoHide />
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
