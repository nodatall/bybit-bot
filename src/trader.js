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
    response => {
      console.log(`opened limit order -->`, response)
      getActiveOrders().then(
        response => {
          console.log(`got active orders -->`, response.result.data)
        },
        console.log
      )
    },
    console.log,
  )
}

function getActiveOrders() {
  return signedRequest({
    method: 'GET',
    path: '/open-api/order/list',
    params: {
      order_status: 'New,PartiallyFilled'
    }
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
