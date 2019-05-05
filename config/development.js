module.exports = {
  env: 'development',
  port: process.env.DEV_PORT,
  infura: {
    provider: process.env.DEV_PROVIDER,
  },
  etherscan: {
    key: process.env.DEV_ETHERSCAN_KEY,
    endpoint: process.env.DEV_ETHERSCAN_ENDPOINT,
  },
  db: {
    user: process.env.DEV_PGUSER,
    host: process.env.DEV_PGHOST,
    database: process.env.DEV_PGDATABASE,
    password: process.env.DEV_PGPASSWORD,
    port: process.env.DEV_PGPORT,
  },
  jwtSecret: process.env.DEV_JWT_SECRET,
  encryptionKey: process.env.DEV_ENCRYPTION_KEY,
};
