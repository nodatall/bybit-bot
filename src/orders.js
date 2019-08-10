const activeOrders = {}

function saveOrders(orders) {
  orders.forEach(order => {
    const { order_status } = order
    if (order_status === 'Cancelled' || order_status === 'Filled') delete activeOrders[order.order_id]
    else if (order_status === 'New' || order_status === 'PartiallyFilled') activeOrders[order.order_id] = order
  })
}

function getActiveOrders() {
  return Object.values(activeOrders)
}

module.exports = {
  saveOrders,
  getActiveOrders,
}
