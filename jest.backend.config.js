export default {
    // display name
    displayName: 'backend',

    // when testing backend
    testEnvironment: 'node',

    // which test to run
    testMatch: [
        '<rootDir>/controllers/*.test.js',
        '<rootDir>/helpers/*.test.js',
        '<rootDir>/middlewares/*.test.js',
        '<rootDir>/models/*.test.js',
        '<rootDir>/routes/*.test.js',
    ],

    // jest code coverage
    collectCoverage: true,
    collectCoverageFrom: ['controllers/**', 'helpers/**', 'middlewares/**'],
    coverageThreshold: {
        global: {
            // require 1% of lines and function coverage (so that can pass the GitHub Actions workflow)
            lines: 1,
            functions: 1,
        },
    },
};
