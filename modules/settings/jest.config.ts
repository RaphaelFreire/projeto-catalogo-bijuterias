import type { Config } from "jest";

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  testMatch: ["**/test/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};

export default config;
