import { defineGpStories } from "@seasketch/geoprocessing/storybook";

// Register to generate stories for each example sketch and its gp function smoke test output
export const storyConfig = defineGpStories({
  componentName: "ReefExtentACA",
  /** Relative path to React component from this config file */
  componentPath: "./ReefExtentACA.tsx",
  title: "Project/Components/ReefExtentACA",
});
