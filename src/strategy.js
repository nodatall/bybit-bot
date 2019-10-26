const { oneMinSSL, threeMinSSL } = require('./ssl')
const Trader = require('./trader')

const trader = new Trader()

/*
  when 1 minute crosses into the same buy that 3 minute is in, limit buy, and sell at .5% above
*/

setInterval(async () => {
  const oneMinResult = await oneMinSSL()
  const threeMinResult = await threeMinSSL()
  if (oneMinResult.crossed && threeMinResult.buy === oneMinResult.buy) {
    await trader.openLimitUntilFilled({ side: oneMinResult.buy ? 'buy' : 'sell '})
  } else if (threeMinResult.crossed) {
    await trader.cancellAllActiveOrders()
    await trader.marketSellCurrentPosition()
  }
}, 1000)
