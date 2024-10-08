import clearTestDatabase from "clear-test-db";
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:8100",

    setupNodeEvents(on, config) {
      on("task", {
        clearTestDB: () => {
          return clearTestDatabase();
        },
      });
    },
  },
});
