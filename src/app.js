require('../environment')

const crypto = require('crypto')
const WebSocket = require('ws')

const handleCandles = require('./ssl')

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

ws.on('message', function incoming(data) {
  const response = JSON.parse(data)
  if (response.ret_msg === 'pong' && response.success === true) {
    console.log(`-:: connection successfull subscribing to candles ::-`)
    ws.send('{"op":"subscribe","args":["kline.BTCUSD.1m"]}')
  }
  if (response.topic && response.topic.includes('kline.BTCUSD')) {
    handleCandles(response.data)
  }
})


