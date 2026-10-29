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
    // 与微信运行时同一入口（miniprogram_npm = dist/mini = entries/mini.ts），
    // 避免 tsc(main=src/index.ts) 与运行时(mini entry) 导出面错位
    '^@looma/shared-core$': '<rootDir>/packages/shared-core/src/entries/mini.ts',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['packages/miniprogram/utils/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
}
