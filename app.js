require('./environment')

const crypto = require('crypto')
const WebSocket = require('ws')

const api_key = process.env.API_KEY
const secret = process.env.SECRET
const expires = Date.now() + 1000

const signature = crypto
  .createHmac('sha256', secret)
  .update('GET/realtime' + expires)
  .digest('hex')

const param = `api_key=${api_key}&expires=${expires}&signature=${signature}`
const ws = new WebSocket(`${process.env.WEBSOCKET_URL}?${param}`);

ws.on('open', function open() {
  ws.send('{"op":"ping"}')
})

ws.on('message', function incoming(data) {
  console.log(data)
})
