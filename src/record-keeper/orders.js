const client = require('../../database')

async function saveOrders(orders) {
  for (const order of orders) {
    const { order_status, order_id, symbol, side, price, qty, time_in_force } = order
    if (order_status === 'Cancelled' || order_status === 'Filled') {
      await client.query(
        `
          DELETE FROM orders
          WHERE order_id = $1;
        `,
        [order_id]
      )
    } else if (order_status === 'New' || order_status === 'PartiallyFilled') {
      await client.query(
        `
          INSERT INTO orders (
            order_id,
            symbol,
            side,
            price,
            qty,
            time_in_force
          ) values ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (order_id)
          DO UPDATE
          SET price = $4, qty = $5, time_in_force = $6;
        `,
        [order_id, symbol, side, price, qty, time_in_force]
      )
    }
  }
}

async function getActiveOrders() {
  return await client.query(`SELECT * FROM orders;`)
}

module.exports = {
  saveOrders,
  getActiveOrders,
}
