const request = require('request-promise')
const crypto = require('crypto')
const chalk = require('chalk')

const { getHighestBuyLowestSell } = require('./orderbook')
const { getPosition } = require('./position')
const { getActiveOrders } = require('./orders')

async function exitPositionWithLimitAtXPercent({ percent }) {
  const BTCPosition = getPosition()
  const exitPrice = Math.floor(
    ((BTCPosition.entry_price * (1 + ((percent / 100) / BTCPosition.leverage))) * 2)
  ) / 2
  await openLimitOrder({
    qty: BTCPosition.size,
    price: exitPrice,
    side: BTCPosition.side === 'Sell' ? 'Buy' : 'Sell',
  })
}

async function openLimitUntilFilled({ side }) {

  let BTCPosition = getPosition()
  const entryPrice = getEntryPrice(side)

  let targetQty = Math.floor((BTCPosition.wallet_balance * entryPrice) * 9.7)

  let orderResponse = await openLimitOrder({
    qty: targetQty,
    price: entryPrice,
    side,
  })
  console.log(chalk.grey(`Opened new order at ${entryPrice}`))

  replaceOrderUntilFilled()

  function replaceOrderUntilFilled() {
    setTimeout(async () => {
      BTCPosition = getPosition()
      if (BTCPosition.size >= targetQty) {
        console.log(chalk.green(`${side} for ${targetQty} filled\n`))
        await exitPositionWithLimitAtXPercent({ percent: 1 })
        return
      }

      if (orderResponse.ret_msg && orderResponse.ret_msg.includes('cannot cover by estimated max_affordable_oc')) {
        targetQty -= .1
      }
      const activeOrders = getActiveOrders()
      const newEntryPrice = getEntryPrice(side)

      if (activeOrders.length > 0) {
        let cancelledOrderQtys = 0
        for (order of activeOrders) {
          if (
            (order.side === 'Sell' && newEntryPrice < order.price) ||
            (order.side === 'Buy' && newEntryPrice > order.price)
          ) {
            await cancelActiveOrder(order.order_id)
            cancelledOrderQtys += order.qty
            console.log(chalk.grey(`Cancelled order at ${order.price}`))
          }
        }
        if (cancelledOrderQtys > 0) {
          orderResponse = await openLimitOrder({
            qty: cancelledOrderQtys,
            price: newEntryPrice,
            side,
          })
          console.log(chalk.grey(`Opened new order at ${newEntryPrice}`))
        }
      } else {
        if (targetQty > BTCPosition.size) targetQty = targetQty - BTCPosition.size
        orderResponse = await openLimitOrder({
          qty: targetQty,
          price: newEntryPrice,
          side,
        })
      }

      return replaceOrderUntilFilled()
    }, 1500)
  }
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

function getOrderStatus({ orderId }) {
  return signedRequest({
    method: 'GET',
    path: '/open-api/order/list',
    params: {
      order_id: orderId,
    }
  })
}

function getPositionsList() {
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
    .then(response => {
      handleError(response)
      return response
    })
}

function handleError(response) {
  if (response.ret_msg.includes('error')) {
    console.log(response)
  }
}

module.exports = {
  openLimitOrder,
  openMarketOrder,
  openLimitUntilFilled,
  getPositionsList,
  exitPositionWithLimitAtXPercent,
}
