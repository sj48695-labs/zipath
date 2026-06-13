/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  rootDir: ".",
  roots: ["<rootDir>/src"],
  testRegex: ".*\\.test\\.ts$",
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2020",
          lib: ["dom", "dom.iterable", "esnext"],
          module: "commonjs",
          esModuleInterop: true,
          strict: true,
          jsx: "react-jsx",
          skipLibCheck: true,
        },
      },
    ],
  },
  testEnvironment: "node",
  maxWorkers: 1,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = config;
