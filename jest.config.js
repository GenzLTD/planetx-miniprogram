/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages/miniprogram'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/miniprogram_npm/'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2018',
          module: 'CommonJS',
          moduleResolution: 'node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@looma/shared-core$': '<rootDir>/packages/shared-core/src/index.ts',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['packages/miniprogram/utils/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
}
