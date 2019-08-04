require('../environment')

const crypto = require('crypto')
const WebSocket = require('ws')

const determineBuyOrSell = require('./ssl')
const { updateOrderBook, setInitialOrderBook } = require('./orderbook')
const { openLimitOrderAtBestPrice } = require('./trader')

const ws = createWebsocket()

let currentOrderType

ws.on('message', function incoming(data) {
  const response = JSON.parse(data)
  if (response.ret_msg === 'pong' && response.success === true) {
    console.log(`-:: connection successfull subscribing to candles ::-`)
    ws.send('{"op":"subscribe","args":["kline.BTCUSD.1m"]}')
    ws.send('{"op": "subscribe", "args": ["orderBookL2_25.BTCUSD"]}')
  }
  if (response.topic && response.topic.includes('kline.BTCUSD')) {
    const buyOrSell = determineBuyOrSell(response.data)
    if (buyOrSell && currentOrderType !== buyOrSell) {
      currentOrderType = buyOrSell
    }
  }
  if (response.topic && response.topic.includes('orderBook')) {
    const { type, data } = response
    if (type === 'snapshot') {
      setInitialOrderBook(data)
      openLimitOrderAtBestPrice({ side: 'Sell' })
    }
    else if (type === 'delta') {
      updateOrderBook(data)
    }
  }
})

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
