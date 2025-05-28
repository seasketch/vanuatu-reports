import { defineGpStories } from "@seasketch/geoprocessing/storybook";

// Register to generate stories for each example sketch and its gp function smoke test output
export const storyConfig = defineGpStories({
  componentName: "Richness",
  /** Relative path to React component from this config file */
  componentPath: "./Richness.tsx",
  title: "Project/Components/Richness",
});
