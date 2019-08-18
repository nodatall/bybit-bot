const client = require('../../database')

async function setInitialOrderBook(orderBookData) {
  await client.query(`DELETE FROM orderbook`)

  for (const order of orderBookData) {
    await addOrder(order)
  }
}

async function updateOrderBook(orderBookUpdate) {
  for (const update of Object.entries(orderBookUpdate)) {
    const [key, values] = update
    if (key === 'delete') {
      for (const orderToDelete of values) {
        await deleteOrder(orderToDelete.id)
      }
    } else if (key === 'update') {
      for (const orderToUpdate of values) {
        await updateOrder(orderToUpdate)
      }
    } else if (key === 'insert') {
      for (const orderToInsert of values) {
        await addOrder(orderToInsert)
      }
    }
  }
}

async function addOrder(order) {
  const { id, price, symbol, side, size } = order
  await client.query(
    `
      INSERT INTO orderbook (
        id,
        price,
        symbol,
        side,
        size
      ) values ($1, $2, $3, $4, $5)
      ON CONFLICT (id)
      DO UPDATE
      SET price = $2, symbol = $3, side = $4, size = $5
    `,
    [id, price, symbol, side, size]
  )
}

async function updateOrder(order) {
  const { id, price, symbol, side, size } = order
  await client.query(
    `
      UPDATE orderbook
      SET price = $1, symbol = $2, side = $3, size = $4
      WHERE id = $5
    `,
    [price, symbol, side, size, id]
  )
}

async function deleteOrder(orderId) {
  await client.query(
    `
      DELETE FROM orderbook
      WHERE id = $1
    `,
    [orderId]
  )
}

async function getHighestBuyLowestSell() {
  const orders = await client.query(`SELECT * FROM orderbook ORDER BY price`)

  return {
    highestBuy: orders[(orders.length / 2) - 1],
    lowestSell: orders[orders.length / 2],
  }
}

module.exports = {
  setInitialOrderBook,
  updateOrderBook,
  getHighestBuyLowestSell,
}
