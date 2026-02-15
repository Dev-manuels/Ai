module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@football/database$': '<rootDir>/../../packages/database',
    '^@football/ingestion$': '<rootDir>/../../packages/ingestion/src'
  }
};
