require('../environment')

const crypto = require('crypto')
const WebSocket = require('ws')

const determineBuyOrSell = require('./ssl')
const trade = require('./trade')

const ws = createWebsocket()

let currentOrderType
const orderBook = {
  buys: {},
  sells: {},
}

ws.on('message', function incoming(data) {
  const response = JSON.parse(data)
  if (response.ret_msg === 'pong' && response.success === true) {
    console.log(`-:: connection successfull subscribing to candles ::-`)
    ws.send('{"op":"subscribe","args":["kline.BTCUSD.1m"]}')
    subscribeToOrderBook()
  }
  if (response.topic && response.topic.includes('kline.BTCUSD')) {
    const buyOrSell = determineBuyOrSell(response.data)
    if (buyOrSell && currentOrderType !== buyOrSell) {
      currentOrderType = buyOrSell
      // trade(buyOrSell)
    }
  }
  if (response.topic && response.topic.includes('orderBook')) {
    const { type, data } = response
    if (type === 'snapshot') setInitialOrderBook(data)
    else if (type === 'delta') updateOrderBook(data)
  }
})

function setInitialOrderBook(orderBookData) {
  orderBookData.forEach(order => {
    if (order.side === 'Sell') orderBook.sells[order.id] = order
    if (order.side === 'Buy') orderBook.buys[order.id] = order
  })
  getHighestBuyLowestSell()
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
  getHighestBuyLowestSell()
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

function subscribeToOrderBook() {
  ws.send('{"op": "subscribe", "args": ["orderBookL2_25.BTCUSD"]}')
}

function createWebsocket() {
  const expires = Date.now() + 10000
  const signature = crypto
    .createHmac('sha256', process.env.SECRET)
    .update('GET/realtime' + expires)
    .digest('hex')
  const param = `api_key=${process.env.API_KEY}&expires=${expires}&signature=${signature}`
  const ws = new WebSocket(`${process.env.WEBSOCKET_URL}?${param}`);

  ws.on('open', function open() {
    ws.send('{"op":"ping"}')
  })

  return ws
}
