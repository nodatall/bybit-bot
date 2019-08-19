const SMA = require('technicalindicators').SMA

const { getHighestBuyLowestSell } = require('./orderbook')

let hlv
let buy

function calculateSSL({lows, highs, close}) {
  const lowSMAs = SMA.calculate({ period: 10, values: lows })
  const highSMAs = SMA.calculate({ period: 10, values: highs })
  const lowSMA = lowSMAs[lowSMAs.length -1]
  const highSMA = highSMAs[highSMAs.length -1]
  hlv = close > highSMA ? 1 : close < lowSMA ? - 1 : hlv
  const sslDown = hlv < 0 ? highSMA : lowSMA
  const sslUp = hlv < 0 ? lowSMA : highSMA
  if (sslUp > sslDown) {
    if (buy === undefined) {
      buy = true
      return
    }
    if (!buy) {
      console.log(`-:: just switched to buy buy buy ::-`)
      buy = true
      return 'buy'
    }
    const { highestBuy } = getHighestBuyLowestSell()
    console.log(`highestBuy -->`, highestBuy)
    console.log(`lowSMA -->`, lowSMA)
    console.log(`highSMA -->`, highSMA)
  } else {
    if (buy) {
      console.log(`-:: just switched to sell sell sell ::-`)
      buy = false
      return 'sell'
    }
    const { lowestSell } = getHighestBuyLowestSell()
    console.log(`lowestSell -->`, lowestSell)
    console.log(`lowSMA -->`, lowSMA)
    console.log(`highSMA -->`, highSMA)
  }
}
