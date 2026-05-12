export const databaseConfig = {
  url: process.env.DATABASE_URL || 'file:./database/dev.db',
};

export const testDatabaseConfig = {
  url: process.env.TEST_DATABASE_URL || 'file:./database/test.db',
};
