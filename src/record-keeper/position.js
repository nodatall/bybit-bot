const client = require('../../database')

async function setPosition(positionData) {
  for (const position of positionData) {
    const {
      id,
      symbol,
      side,
      size,
      position_value,
      entry_price,
      leverage,
      liq_price,
      wallet_balance,
    } = position


    if (position.id) {
      // setting intitial position
      await client.query(
        `
          INSERT INTO position (
            id,
            symbol,
            side,
            size,
            position_value,
            entry_price,
            leverage,
            liq_price,
            wallet_balance
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          id,
          symbol,
          side,
          size,
          position_value,
          entry_price,
          leverage,
          liq_price,
          wallet_balance,
        ]
      )
    } else {
      // updating position
      await client.query(
        `
          UPDATE position
          SET
            side = $1,
            size = $2,
            position_value = $3,
            entry_price = $4,
            leverage = $5,
            liq_price = $6
          WHERE symbol = $7;
        `,
        [
          side,
          size,
          position_value,
          entry_price,
          leverage,
          liq_price,
          symbol,
        ]
      )
    }

  }
}

async function getPosition(symbol = 'BTCUSD') {
  return positions[symbol]
}

module.exports = {
  setPosition,
  getPosition,
}
