import React from "react";
import {
  ClassTable,
  Column,
  LayerToggle,
  SketchClassTableStyled,
  Table,
} from "@seasketch/geoprocessing/client-ui";
import { MetricGroup } from "@seasketch/geoprocessing/client-core";

// ClassTable wrapper that disables pagination when printing
export const ClassTablePrintAware: React.FunctionComponent<{
  rows: any[];
  metricGroup: MetricGroup;
  columnConfig: any[];
  printing: boolean;
}> = ({ rows, metricGroup, columnConfig, printing }) => {
  // When printing, we need to create a custom table without pagination
  if (printing) {
    const classesByName = Object.fromEntries(
      metricGroup.classes.map((curClass) => [curClass.classId, curClass]),
    );

    // Create table rows
    const tableRows = rows.map((row) => ({ classId: row.classId }));

    // Generate columns similar to ClassTable
    const columns: Column<{ classId: string }>[] = columnConfig.map(
      (colConfig) => {
        const style = {
          width: `${colConfig.width || 100 / columnConfig.length}%`,
          ...(colConfig.colStyle ? colConfig.colStyle : {}),
        };

        switch (colConfig.type) {
          case "class": {
            return {
              Header: colConfig.columnLabel || "Class",
              accessor: (row) => {
                return (
                  classesByName[row.classId || "missing"]?.display || "missing"
                );
              },
              style,
            };
          }
          case "metricValue": {
            return {
              Header: colConfig.columnLabel || "Value",
              accessor: (row) => {
                const metric = rows.find((r) => r.classId === row.classId);
                const value = metric ? metric.value : 0;
                const formattedValue = colConfig.valueFormatter
                  ? (colConfig.valueFormatter as (val: any) => any)(value)
                  : value;
                return (
                  <>
                    {formattedValue}
                    {colConfig.valueLabel ? ` ${colConfig.valueLabel}` : ""}
                  </>
                );
              },
              style,
            };
          }
          case "layerToggle": {
            return {
              Header: colConfig.columnLabel || "Map",
              style: { textAlign: "center", ...style },
              accessor: (row, index) => {
                const layerId =
                  metricGroup.layerId || classesByName[row.classId!]?.layerId;
                if (layerId) {
                  return (
                    <LayerToggle
                      simple
                      size="small"
                      layerId={layerId}
                      style={{
                        marginTop: 0,
                        justifyContent: "center",
                      }}
                    />
                  );
                }
                return <></>;
              },
            };
          }
          default: {
            return {
              Header: colConfig.columnLabel || "Column",
              accessor: () => "",
              style,
            };
          }
        }
      },
    );

    return (
      <SketchClassTableStyled>
        <Table
          className="styled"
          columns={columns}
          data={tableRows}
          initialState={{ pageSize: 1000 }} // Large page size to disable pagination
        />
      </SketchClassTableStyled>
    );
  }

  // Normal ClassTable for non-printing mode
  return (
    <ClassTable
      rows={rows}
      metricGroup={metricGroup}
      columnConfig={columnConfig}
    />
  );
};
