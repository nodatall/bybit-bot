const request = require('request-promise')
const crypto = require('crypto')

const { getHighestBuyLowestSell } = require('./orderbook')

async function openLimitOrderAtBestPrice({ side }) {

  const BTCPosition = (await getPosition()).result.filter(position => position.symbol === 'BTCUSD')[0]
  const BTCBalance = BTCPosition.wallet_balance

  const entryPrice = getEntryPrice(side)
  const orderResponse = await openLimitOrder({
    qty: Math.floor((BTCBalance * entryPrice) * 9.8),
    price: entryPrice,
    side,
  })

  const random = Math.random().toString().slice(2,10)
  console.log(`-:: Placed ${side} order at ${entryPrice} ::-`)

  if (orderResponse.ret_msg && orderResponse.ret_msg.includes('cannot cover by estimated max_affordable_oc')) {
    console.log(`-:: Not enough funds to place order ::-`)
    return
  }

  let currentOrder = orderResponse.result

  function replaceOrderUntilFilled() {
    setTimeout(async () => {
      const orders = ((await getOrders()).result.data)
      const currentOrderCancelled = orders.find(order => {
        return order.order_id === currentOrder.order_id
          && order.order_status === 'Cancelled'
      })
      if (currentOrderCancelled) {
        openLimitOrderAtBestPrice({ side })
        return
      }
      const activeOrders = orders.filter(order => order.order_status !== 'Cancelled')
      if (activeOrders.length === 0) {
        console.log(`-:: ${side} order #${random} filled ::-`)
        const newPosition = (await getPosition()).result.filter(position => position.symbol === 'BTCUSD')[0]
        console.log(`newPosition -->`, newPosition)
        return
      }
      let cancelledOrderQtys = 0
      const newEntryPrice = getEntryPrice(side)
      for (order of activeOrders) {
        if (
          (order.side === 'Sell' && newEntryPrice < order.price) ||
          (order.side === 'Buy' && newEntryPrice > order.price)
        ) {
          await cancelActiveOrder(order.order_id)
          cancelledOrderQtys += order.qty
          console.log(`-:: cancelled order at ${order.price} ::-`)
        }
      }
      if (cancelledOrderQtys > 0) {
        console.log(`-:: opened new order at ${newEntryPrice} ::-`)
        const updatedOrderResponse = await openLimitOrder({
          qty: cancelledOrderQtys,
          price: newEntryPrice,
          side,
        })
        currentOrder = updatedOrderResponse.result
      }
      return replaceOrderUntilFilled()
    }, 1500)
  }

  replaceOrderUntilFilled()
}

function getEntryPrice(side) {
  let { highestBuy, lowestSell } = getHighestBuyLowestSell()
  return side === 'Sell' ? +highestBuy + .5 : +lowestSell - .5
}

function cancelActiveOrder(orderId) {
  return signedRequest({
    method: 'POST',
    path: '/open-api/order/cancel',
    params: {
      order_id: orderId,
    }
  })
}

function getOrders() {
  return signedRequest({
    method: 'GET',
    path: '/open-api/order/list',
    params: {
      order_status: 'New,PartiallyFilled,Cancelled'
    }
  })
}

function getOrderStatus({ orderId }) {
  return signedRequest({
    method: 'GET',
    path: '/open-api/order/list',
    params: {
      order_id: orderId,
    }
  })
}

function getPosition() {
  return signedRequest({
    method: 'GET',
    path: '/position/list'
  })
}

function openLimitOrder({ qty, price, side }) {
  return openOrder({
    order_type: 'Limit',
    price,
    qty,
    side,
    symbol: 'BTCUSD',
    time_in_force: 'PostOnly',
  })
}

function openMarketOrder({ qty, side }) {
  return openOrder({
    order_type: 'Market',
    price: '',
    qty,
    side,
    symbol: 'BTCUSD',
    time_in_force: '',
  })
}

function openOrder({ qty, time_in_force, price, order_type, side }) {
  return signedRequest({
    method: 'POST',
    path: '/open-api/order/create',
    params: {
      order_type,
      price,
      qty,
      side,
      symbol: 'BTCUSD',
      time_in_force,
    }
  })
}

function signedRequest({ method, path, params }) {
  const timestamp = Date.now()
  const api_key = process.env.API_KEY

  const allParams = {
    api_key,
    timestamp,
    ...params,
  }

  let paramString = ''
  Object.keys(allParams).sort().forEach((key, index) => {
    if (index === 0) {
      paramString += `${key}=${allParams[key]}`
    } else {
      paramString += `&${key}=${allParams[key]}`
    }
  })

  const sign = crypto
    .createHmac('sha256', process.env.SECRET)
    .update(paramString)
    .digest('hex')

  let uri = `${process.env.URL}${path}`
  if (method === 'GET') {
    uri += `?${paramString}&sign=${sign}`
  }

  const options = {
    method,
    uri,
    json: true,
  }

  if (method === 'POST') {
    options.body = {
      api_key,
      timestamp,
      sign,
      ...params,
    }
  }

  return request(options)
}

module.exports = {
  openLimitOrder,
  openMarketOrder,
  openLimitOrderAtBestPrice,
}
