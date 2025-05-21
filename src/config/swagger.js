const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Histórico de Pontos e Transações API',
      version: '1.0.0',
      description: 'API para registrar e consultar histórico de pontos e trocas de benefícios.',
    },
    servers: [
      {
        url: 'http://localhost:3000/',
      },
    ],
  },
  apis: [path.resolve(__dirname, '../routes/*.js')], // Documentos nas rotas
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
