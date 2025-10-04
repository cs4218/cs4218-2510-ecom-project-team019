export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // This will match any .test.js file in any subdirectory of /client/src
  testMatch: ["<rootDir>/client/src/**/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["client/src/**"],
  coverageThreshold: {
    global: { // require 1% of lines and function coverage (so that can pass the GitHub Actions workflow)
      lines: 1,
      functions: 1,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
