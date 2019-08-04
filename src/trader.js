const request = require('request-promise')
const crypto = require('crypto')

const { getHighestBuyLowestSell } = require('./orderbook')

function openLimitOrderAtBestPrice({ side }) {
  const { highestBuy, lowestSell } = getHighestBuyLowestSell()
  openLimitOrder({
    qty: 100,
    price: side === 'Sell' ? lowestSell : highestBuy,
    side,
  }).then(
    console.log,
    console.log,
  )
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
    body: {
      order_type,
      price,
      qty,
      side,
      symbol: 'BTCUSD',
      time_in_force,
    }
  })
}

function signedRequest({ method, path, body }) {
  const timestamp = Date.now()
  const api_key = process.env.API_KEY

  const params = {
    api_key,
    timestamp,
    ...body,
  }

  let paramString = ''
  Object.keys(params).sort().forEach((key, index) => {
    if (index === 0) {
      paramString += `${key}=${params[key]}`
    } else {
      paramString += `&${key}=${params[key]}`
    }
  })

  const sign = crypto
    .createHmac('sha256', process.env.SECRET)
    .update(paramString)
    .digest('hex')

  return request({
    method,
    uri: `${process.env.URL}${path}`,
    json: true,
    body: {
      api_key,
      timestamp,
      sign,
      ...body,
    },
  })
}

module.exports = {
  openLimitOrder,
  openMarketOrder,
  openLimitOrderAtBestPrice,
}
