const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const walletRoutes = require('./server/routes/wallet');
const authRoutes = require('./server/routes/auth');
const ratesRoutes = require('./server/routes/rates');

const app = express();

const swaggerDocument = YAML.load('./api/swagger/swagger.yaml');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/rates', ratesRoutes);

module.exports = app;
