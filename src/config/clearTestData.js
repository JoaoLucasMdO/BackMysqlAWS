require('dotenv').config();
const { promisePool } = require('../db/db'); 

async function clearTestData() {
  try {
    // Deleta tudo da tabela histPoints
    await promisePool.execute('DELETE FROM histPoints');
    console.log('Todos os dados da tabela histPoints foram removidos.');

    // Deleta tudo da tabela histTransactions
    await promisePool.execute('DELETE FROM histTransactions');
    console.log('Todos os dados da tabela histTransactions foram removidos.');

    process.exit(0);
  } catch (error) {
    console.error('Erro ao limpar dados:', error.message);
    process.exit(1);
  }
}

clearTestData();