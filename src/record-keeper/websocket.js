require('../../environment')

const crypto = require('crypto')
const WebSocket = require('ws')
const chalk = require('chalk')

const { updateOrderBook, setInitialOrderBook } = require('./orderbook')
const { saveOrders } = require('./orders')
const { setPosition } = require('./position')
const { saveCandles } = require('./candles')
const {
  getPositionsList,
  getActiveOrders,
} = require('../api')

const ws = createWebsocket()

ws.on('message', async function incoming(data) {
  const response = JSON.parse(data)
  if (response.ret_msg === 'pong' && response.success === true) {
    console.log(chalk.green('\nWebsocket connection success!'))
    ws.send('{"op": "subscribe", "args": ["orderBookL2_25.BTCUSD"]}')

    const positions = await getPositionsList()
    await setPosition(positions.result)
    console.log(chalk.blue('Initialized position'))

    const activeOrders = await getActiveOrders()
    await saveOrders(activeOrders.result.data)
    console.log(chalk.blue('Initialized orders\n'))

    ws.send('{"op": "subscribe", "args": ["position"]}')
    ws.send('{"op": "subscribe", "args": ["kline.BTCUSD.1m"]}')
    ws.send('{"op": "subscribe", "args": ["orderBookL2_25.BTCUSD"]}')
    ws.send('{"op": "subscribe", "args": ["order"]}')
  }
  if (response.topic && response.topic.includes('kline.BTCUSD')) {
    saveCandles(response.data)
  }
  if (response.topic && response.topic.includes('orderBook')) {
    const { type, data } = response
    if (type === 'snapshot') {
      setInitialOrderBook(data)
    } else if (type === 'delta') {
      updateOrderBook(data)
    }
  }
  if (response.topic && response.topic.includes('position')) {
    setPosition(response.data)
  }
  if (response.topic && response.topic === 'order') {
    saveOrders(response.data)
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
