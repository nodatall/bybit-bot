const SMA = require('technicalindicators').SMA

const { getCandles } = require('./record-keeper/candles')

const oneMinSSLTracker = {}
const threeMinSSLTracker = {}

async function oneMinSSL() {
  return await sslForPeriod(oneMinSSLTracker)
}

async function threeMinSSL() {
  return await sslForPeriod(threeMinSSLTracker, 3)
}

async function sslForPeriod(sslTracker, period = 1) {
  const processedCandles = await processCandles(period)
  if (processedCandles === 'pending candles') return processedCandles

  const { highs, lows, close } = processedCandles
  const ssl = calculateSSL({
    lows,
    highs,
    close,
    hlv: oneMinSSLTracker.hlv,
    buy: oneMinSSLTracker.buy,
    crossed: oneMinSSLTracker.crossed,
  })

  Object.assign(sslTracker, ssl)

  return {
    buy: sslTracker.buy,
    sslUp: sslTracker.sslUp,
    sslDown: sslTracker.sslDown,
    crossed: sslTracker.crossed,
  }
}

async function processCandles(period = 1) {
  const candles = await getCandles((period * 10) +1)
  if (candles.length < ((period * 10) + (1 * period))) return 'pending candles'
  const lows = []
  const highs = []
  let tmpLow = Infinity
  let tmpHigh = -Infinity
  let pushTmpCount = 0
  candles.forEach(candle => {
    tmpLow = candle.low < tmpLow ? +candle.low : tmpLow
    tmpHigh = candle.high > tmpHigh ? +candle.high : tmpHigh
    pushTmpCount++
    if (pushTmpCount === period) {
      lows.push(+tmpLow)
      highs.push(+tmpHigh)
      tmpLow = Infinity
      tmpHigh = -Infinity
      pushTmpCount = 0
    }
  })

  return { lows, highs, close: candles[0].close }
}

function calculateSSL({
  lows,
  highs,
  close,
  hlv,
  buy,
  crossed = false,
}) {
  const lowSMAs = SMA.calculate({ period: 10, values: lows.reverse() })
  const highSMAs = SMA.calculate({ period: 10, values: highs.reverse() })
  const lowSMA = lowSMAs[lowSMAs.length - 1]
  const highSMA = highSMAs[highSMAs.length - 1]
  hlv = close > highSMA ? 1 : close < lowSMA ? - 1 : hlv
  const sslDown = hlv < 0 ? highSMA : lowSMA
  const sslUp = hlv < 0 ? lowSMA : highSMA
  crossed = false
  if (sslUp > sslDown) {
    if (buy === undefined) {
      buy = true
    } else if (buy === false) {
      buy = true
      crossed = true
    }
  } else {
    if (buy === undefined) {
      buy = false
    } else if (buy === true) {
      buy = false
      crossed = true
    }
  }

  return {
    sslDown,
    sslUp,
    buy,
    crossed,
    hlv,
  }
}

module.exports = {
  oneMinSSL,
  threeMinSSL,
}
