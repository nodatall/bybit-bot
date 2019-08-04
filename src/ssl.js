const SMA = require('technicalindicators').SMA

const highs = []
const lows = []
let lastPeriod
let hlv
let buy

module.exports = function(candles) {
  const { high, low, open_time, close } = candles
  if (!lastPeriod) {
    lastPeriod = open_time
    highs.push(high)
    lows.push(low)
  } else if (open_time - lastPeriod === 360) {
    lastPeriod = open_time
    highs.push(high)
    lows.push(low)
    if (highs.length > 10) {
      return calculateSSL({lows, highs, close})
    }
  } else {
    if (high > highs[highs.length - 1]) {
      highs[highs.length - 1] = high
    }
    if (low < lows[lows.length -1]) {
      lows[lows.length -1] = low
    }

    if (highs.length > 10) {
      return calculateSSL({lows, highs, close})
    }
  }
}

function calculateSSL({lows, highs, close}) {
  const lowSMAs = SMA.calculate({ period: 10, values: lows })
  const highSMAs = SMA.calculate({ period: 10, values: highs })
  const lowSMA = lowSMAs[lowSMAs.length -1]
  const highSMA = highSMAs[highSMAs.length -1]
  hlv = close > highSMA ? 1 : close < lowSMA ? - 1 : hlv
  const sslDown = hlv < 0 ? highSMA : lowSMA
  const sslUp = hlv < 0 ? lowSMA : highSMA
  if (sslUp > sslDown) {
    if (buy === undefined) buy = true
    if (!buy) return 'buy'
    buy = true
  } else {
    if (buy) return 'sell'
    buy = false
  }
}
