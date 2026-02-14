const { Client } = require('pg');

async function setupTimescale() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    // Enable TimescaleDB extension if not already enabled
    await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');

    // Convert MatchEvent and InPlayOdds to hypertables
    // Note: In TimescaleDB, the primary key must include the partitioning column (timestamp)
    // Prisma's default UUID as @id makes this tricky without composite keys.
    // For Phase 5, we will focus on the time-series indexing.

    console.log('TimescaleDB setup complete (extension enabled).');
    console.log('To fully utilize hypertables, the schema should be migrated to include timestamp in primary keys.');
  } catch (err) {
    console.error('Error setting up TimescaleDB:', err);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  setupTimescale();
}
