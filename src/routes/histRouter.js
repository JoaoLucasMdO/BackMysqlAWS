const express = require('express');
const router = express.Router();
const { promisePool } = require('../db/db'); 
const logger = require('../config/logger');



// Função para ajustar as datas para o formato correto
function getBrazilDateTime() {
  const date = new Date().toLocaleString('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  }).replace(' ', 'T'); // Formato: 'YYYY-MM-DDTHH:MM:SS'
  return date;
}


/**
 * @swagger
 * /hist/pontos:
 *   post:
 *     summary: Registra pontos após leitura do QR code
 *     tags: [Histórico]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, idUser, points]
 *             properties:
 *               id:
 *                 type: string
 *               idUser:
 *                 type: string
 *               points:
 *                 type: number
 *     responses:
 *       201:
 *         description: Pontos registrados com sucesso
 */
router.post('/hist/pontos', async (req, res) => {
  try {
    const { id, idUser, points } = req.body;

    if (!id || !idUser || !points) {
      logger.warn({
        message: 'Campos obrigatórios ausentes em /hist/pontos',
        body: req.body,
        rota: '/hist/pontos'
      });
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const brazilDate = getBrazilDateTime();

    const query = `
      INSERT INTO histPoints (id, points, idUser, date)
      VALUES (?, ?, ?, ?)
    `;
    await promisePool.execute(query, [id, points, idUser, brazilDate]);

    logger.info({
      message: 'Histórico de pontos registrado',
      id, idUser, points, date: brazilDate,
      rota: '/hist/pontos'
    });

    res.status(201).json({ message: 'Histórico de pontos registrado com sucesso.' });
  } catch (error) {
    logger.error({
      message: 'Erro ao registrar histórico de pontos',
      error: error.message,
      stack: error.stack,
      rota: '/hist/pontos'
    });
    res.status(500).json({ error: 'Erro ao registrar histórico de pontos.', details: error.message });
  }
});

/**
 * @swagger
 * /hist/transacoes:
 *   post:
 *     summary: Registra uma transação de benefício
 *     tags: [Histórico]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idUser, description, points]
 *             properties:
 *               idUser:
 *                 type: string
 *               description:
 *                 type: string
 *               points:
 *                 type: number
 *     responses:
 *       201:
 *         description: Transação registrada com sucesso
 */
router.post('/hist/transacoes', async (req, res) => {
  try {
    const { idUser, description, points } = req.body;

    if (!idUser || !description || !points) {
      logger.warn({
        message: 'Campos obrigatórios ausentes em /hist/transacoes',
        body: req.body,
        rota: '/hist/transacoes'
      });
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const brazilDate = getBrazilDateTime();

    const query = `
      INSERT INTO histTransactions (description, points, idUser, date)
      VALUES (?, ?, ?, ?)
    `;
    await promisePool.execute(query, [description, points, idUser, brazilDate]);

    logger.info({
      message: 'Histórico de transação registrado',
      idUser, description, points, date: brazilDate,
      rota: '/hist/transacoes'
    });

    res.status(201).json({ message: 'Histórico de transação registrado com sucesso.' });
  } catch (error) {
    logger.error({
      message: 'Erro ao registrar transação',
      error: error.message,
      stack: error.stack,
      rota: '/hist/transacoes'
    });
    res.status(500).json({ error: 'Erro ao registrar transação.', details: error.message });
  }
});


/**
 * @swagger
 * /hist/{idUser}:
 *   get:
 *     summary: Retorna histórico de pontos e transações de um usuário, filtrado por data
 *     tags: [Histórico]
 *     parameters:
 *       - in: path
 *         name: idUser
 *         schema:
 *           type: string
 *         required: false
 *         description: ID do usuário (se não informado, retorna de todos)
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 */
router.get('/hist/:idUser?', async (req, res) => {
  try {
    const { idUser } = req.params;
    const { start, end } = req.query;

    const startDateTime = start ? `${start} 00:00:00` : '1970-01-01 00:00:00';
    const endDateTime = end ? `${end} 23:59:59` : '2999-12-31 23:59:59';

    let pointsHistory, transactionsHistory;

    if (idUser) {
      [pointsHistory] = await promisePool.execute(
        `SELECT id, idUser, points, date, 'ponto' AS tipo FROM histPoints 
         WHERE idUser = ? AND date BETWEEN ? AND ?`,
        [idUser, startDateTime, endDateTime]
      );

      [transactionsHistory] = await promisePool.execute(
        `SELECT id, idUser, description, points, date, 'transacao' AS tipo FROM histTransactions 
         WHERE idUser = ? AND date BETWEEN ? AND ?`,
        [idUser, startDateTime, endDateTime]
      );
    } else {
      [pointsHistory] = await promisePool.execute(
        `SELECT id, idUser, points, date, 'ponto' AS tipo FROM histPoints 
         WHERE date BETWEEN ? AND ?`,
        [startDateTime, endDateTime]
      );

      [transactionsHistory] = await promisePool.execute(
        `SELECT id, idUser, description, points, date, 'transacao' AS tipo FROM histTransactions 
         WHERE date BETWEEN ? AND ?`,
        [startDateTime, endDateTime]
      );
    }

    function formatDateToBrazil(date) {
      return new Date(date).toLocaleString('pt-BR');
    }

    const history = [...pointsHistory, ...transactionsHistory]
      .map(item => ({
        ...item,
        date: formatDateToBrazil(item.date),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let result;
    if (idUser) {
      result = history;
    } else {
      // Agrupa por idUser
      result = history.reduce((acc, item) => {
        if (!acc[item.idUser]) acc[item.idUser] = [];
        acc[item.idUser].push(item);
        return acc;
      }, {});
    }

    logger.info({
      message: 'Histórico consultado',
      idUser: idUser || 'todos',
      startDateTime,
      endDateTime,
      quantidade: history.length,
      rota: '/hist/:idUser'
    });

    res.json({ history: result });
  } catch (error) {
    logger.error({
      message: 'Erro ao buscar histórico',
      error: error.message,
      stack: error.stack,
      rota: '/hist/:idUser'
    });
    res.status(500).json({ error: 'Erro ao buscar histórico.', details: error.message });
  }
});
module.exports = router;
