/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.service.ts"],
  coverageDirectory: "./coverage",
  transformIgnorePatterns: [],
  testEnvironment: "node",
  maxWorkers: 1,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@zipath/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@zipath/db$": "<rootDir>/../../packages/db/src/index.ts",
  },
};

module.exports = config;
