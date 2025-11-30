/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"]
};

module.exports = config;

