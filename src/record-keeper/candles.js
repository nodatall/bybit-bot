const client = require('../../database')

async function saveCandles(candleData) {
  const { symbol, open_time, open, high, low, close, volume, turnover } = candleData
  await client.query(
    `
      INSERT INTO candles (
        symbol,
        open_time,
        open,
        high,
        low,
        close,
        volume,
        turnover
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (open_time)
      DO UPDATE
      SET
        high = $4,
        low = $5,
        close = $6,
        volume = $7,
        turnover = $8;
    `,
    [symbol, open_time, open, high, low, close, volume, turnover]
  )
}

async function getCandles(limit = 10) {
  return await client.query(
    `
      SELECT * FROM candles
      ORDER BY open_time DESC
      LIMIT $1
    `,
    [limit]
  )
}

module.exports = {
  saveCandles,
  getCandles,
}
