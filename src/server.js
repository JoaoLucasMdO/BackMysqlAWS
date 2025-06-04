require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const histRouter = require('./routes/histRouter'); 
const setupSwagger = require('./config/swagger');

app.use(cors());
app.use(express.json());
app.use('/', histRouter);

setupSwagger(app);

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ouvindo na porta ${PORT}`);
  console.log(`Swagger em: http://localhost:${PORT}/`);
});