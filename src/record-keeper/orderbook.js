const client = require('../../database')

async function setInitialOrderBook(orderBookData) {
  await client.query(`DELETE FROM orderbook`)

  for (const order of orderBookData) {
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
      `,
      [id, price, symbol, side, size]
    )
  }
}

function updateOrderBook(orderBookUpdate) {
  Object.entries(orderBookUpdate).forEach(([key, values]) => {
    if (key === 'delete') {
      values.forEach(orderToDelete => {
        if (orderToDelete.side === 'Sell') delete orderBook.sells[orderToDelete.id]
        else delete orderBook.buys[orderToDelete.id]
      })
    } else if (key === 'update') {
      values.forEach(orderToUpdate => {
        if (orderToUpdate.side === 'Sell') orderBook.sells[orderToUpdate.id] = orderToUpdate
        else orderBook.buys[orderToUpdate.id] = orderToUpdate
      })
    } else if (key === 'insert') {
      values.forEach(orderToInsert => {
        if (orderToInsert.side === 'Sell') orderBook.sells[orderToInsert.id] = orderToInsert
        else orderBook.buys[orderToInsert.id] = orderToInsert
      })
    }
  })
}

function getHighestBuyLowestSell() {
  const highestBuy = Object.values(orderBook.buys)
    .map(order => order.price)
    .sort(function(a, b){return b-a})[0]
  const lowestSell = Object.values(orderBook.sells)
    .map(order => order.price)
    .sort(function(a, b){return a-b})[0]

  return { highestBuy, lowestSell }
}

module.exports = {
  setInitialOrderBook,
  updateOrderBook,
  getHighestBuyLowestSell,
}
