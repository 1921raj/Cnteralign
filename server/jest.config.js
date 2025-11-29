export default {
    preset: null,
    extensionsToTreatAsEsm: ['.js'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {},
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: [
        '<rootDir>/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js'
    ],
    transformIgnorePatterns: [
        'node_modules/(?!(supertest)/)'
    ]
};
