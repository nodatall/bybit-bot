const {
  marketSellCurrentPosition,
  cancellAllActiveOrders,
  openLimitUntilFilled,
} = require('./trader')

module.exports = {
  async sslScalper() {
    // check ssl for buy or sell signal
    await cancellAllActiveOrders()
    await marketSellCurrentPosition()
    openLimitUntilFilled({ side: 'Buy' })
    console.log(`-:: using sslScalper strategy ::-`)
  },
}
