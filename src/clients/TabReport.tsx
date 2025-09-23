import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
  useSketchProperties,
  Card,
} from "@seasketch/geoprocessing/client-ui";
import { Printer } from "@styled-icons/bootstrap";
import { useReactToPrint } from "react-to-print";
import Translator from "../components/TranslatorAsync.js";
import { Sites } from "../components/Sites.js";
import { Size } from "../components/Size.js";
import { BenthicCover } from "../components/BenthicCover.js";
import { Richness } from "../components/Richness.js";
import { JuvenileCoralDensity } from "../components/JuvenileCoralDensity.js";
import { BenthicACA } from "../components/BenthicACA.js";
import { Bathymetry } from "../components/Bathymetry.js";
import { GeomorphACA } from "../components/GeomorphACA.js";
import { ReefExtentACA } from "../components/ReefExtentACA.js";
import { Mangroves } from "../components/Mangroves.js";
import { Dhw } from "../components/Dhw.js";
import { BleachingAlerts } from "../components/BleachingAlerts.js";
import { FishDensity } from "../components/FishDensity.js";
import { FishBiomass } from "../components/FishBiomass.js";
import { InvertDensity } from "../components/InvertDensity.js";
import { StableIsotopes } from "../components/StableIsotopes.js";
import { LandUse } from "../components/LandUse.js";
import { Waterways } from "../components/Waterways.js";
import { Gfw } from "../components/Gfw.jsx";
import { Seamounts } from "../components/Seamounts.js";
import { Geomorphology } from "../components/Geomorphology.js";
import { SketchProperties } from "@seasketch/geoprocessing";
import { Population } from "../components/Population.js";

const BaseReport = () => {
  const { t } = useTranslation();
  const segments = [
    { id: "OVERVIEW", label: t("Overview") },
    { id: "EXPEDITION", label: t("Expedition Data") },
    { id: "REPRESENTATION", label: t("Representation") },
  ];
  const [tab, setTab] = useState<string>("OVERVIEW");

  // Printing
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [attributes] = useSketchProperties();
  const originalAnimationDurations: string[] = [
    ...document.querySelectorAll(".chart, .animated-scatter"),
  ].map((el) => (el as HTMLElement).style.animationDuration);

  useEffect(() => {
    // Remove animations for printing
    if (isPrinting) {
      [...document.querySelectorAll(".chart, .animated-scatter")].forEach(
        (el) => ((el as HTMLElement).style.animationDuration = "0s"),
      );
      handlePrint();
    }

    return () => {
      [...document.querySelectorAll(".chart, .animated-scatter")].forEach(
        (el, index) =>
          ((el as HTMLElement).style.animationDuration =
            originalAnimationDurations[index]),
      );
    };
  }, [isPrinting]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: attributes.name,
    onBeforeGetContent: () => {},
    onAfterPrint: () => setIsPrinting(false),
  });

  return (
    <>
      {/* Print/Save to PDF button */}
      <Printer
        size={18}
        color="#999"
        title="Print/Save to PDF"
        style={{
          float: "right",
          margin: "5px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#666")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
        onClick={() => setIsPrinting(true)}
      />
      {/* Printing loading screen */}
      {isPrinting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card>Printing...</Card>
        </div>
      )}

      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={segments}
        />
      </div>
      <div
        ref={printRef}
        style={{ backgroundColor: isPrinting ? "#FFF" : "inherit" }}
      >
        <style>{getPageMargins()}</style>
        {isPrinting && <SketchAttributes {...attributes} />}
        <ReportPage hidden={!isPrinting && tab !== "OVERVIEW"}>
          <Size printing={isPrinting} />
          <Bathymetry printing={isPrinting} />
          {!isPrinting && <SketchAttributesCard autoHide />}
        </ReportPage>
        <ReportPage hidden={!isPrinting && tab !== "EXPEDITION"}>
          <Sites printing={isPrinting} />
          <BenthicCover printing={isPrinting} />
          <JuvenileCoralDensity printing={isPrinting} />
          <FishDensity printing={isPrinting} />
          <FishBiomass printing={isPrinting} />
          <InvertDensity printing={isPrinting} />
          <Richness printing={isPrinting} />
          <StableIsotopes printing={isPrinting} />
        </ReportPage>
        <ReportPage hidden={!isPrinting && tab !== "REPRESENTATION"}>
          <BenthicACA printing={isPrinting} />
          <GeomorphACA printing={isPrinting} />
          <ReefExtentACA printing={isPrinting} />
          <Mangroves printing={isPrinting} />
          <Dhw printing={isPrinting} />
          <BleachingAlerts printing={isPrinting} />
          <LandUse printing={isPrinting} />
          <Waterways printing={isPrinting} />
          <Population printing={isPrinting} />
          <Gfw printing={isPrinting} />
          <Seamounts printing={isPrinting} />
          <Geomorphology printing={isPrinting} />
        </ReportPage>
      </div>
    </>
  );
};

const getPageMargins = () => {
  return `@page { margin: .1mm !important; }`;
};

const SketchAttributes: React.FunctionComponent<SketchProperties> = (
  attributes,
) => {
  const { t } = useTranslation();
  return (
    <Card>
      <h1 style={{ fontWeight: "normal", color: "#777" }}>{attributes.name}</h1>
      <p>
        {t("Sketch ID")}: {attributes.id}
      </p>
      <p>
        {t("Sketch created")}: {new Date(attributes.createdAt).toLocaleString()}
      </p>
      <p>
        {t("Sketch last updated")}:{" "}
        {new Date(attributes.updatedAt).toLocaleString()}
      </p>
      <p>
        {t("Document created")}: {new Date().toLocaleString()}
      </p>
      <SketchAttributesCard />
    </Card>
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
