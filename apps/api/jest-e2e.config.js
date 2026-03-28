/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@zipath/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@zipath/db$": "<rootDir>/../../packages/db/src/index.ts",
  },
};

module.exports = config;
