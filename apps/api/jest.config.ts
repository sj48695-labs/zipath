import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["ts", "js", "json"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          rootDir: undefined,
        },
      },
    ],
  },
  transformIgnorePatterns: [],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@zipath/db$": "<rootDir>/../../../packages/db/src/index.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default config;
