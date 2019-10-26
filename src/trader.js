const chalk = require('chalk')

const { openOrder, cancelActiveOrder } = require('./api')

module.exports = class Trader {
  constructor() {
    this.cancelAllOrders = false
  }

  setCancelAllOrders(bool) {
    this.cancelAllOrders = bool
  }

  async marketSellCurrentPosition() {
    const BTCPosition = getPosition()
    if (BTCPosition.size === 0) return
    return await openMarketOrder({
      qty: BTCPosition.size,
      side: BTCPosition.side === 'Sell' ? 'Buy' : 'Sell',
    })
  }

  async exitPositionWithLimitAtXPercent({ percent }) {
    const BTCPosition = getPosition()
    const exitPrice = BTCPosition.side === 'Sell' ?
      Math.floor(
        ((BTCPosition.entry_price * (1 - ((percent / 100) / BTCPosition.leverage))) * 2)
      ) / 2 :
      Math.floor(
        ((BTCPosition.entry_price * (1 + ((percent / 100) / BTCPosition.leverage))) * 2)
      ) / 2
    await openLimitOrder({
      qty: BTCPosition.size,
      price: exitPrice,
      side: BTCPosition.side === 'Sell' ? 'Buy' : 'Sell',
    })
  }

  async cancellAllActiveOrders(){
    const activeOrders = getActiveOrders()
    if (activeOrders.length > 0) {
      for (order of activeOrders) {
        await cancelActiveOrder(order.order_id)
      }
    }
    this.setCancelAllOrders(true)
  }

  async openLimitUntilFilled({ side }) {
    this.setCancelAllOrders(false)

    let BTCPosition = getPosition()
    const entryPrice = getEntryPrice(side)

    let targetQty = Math.floor((BTCPosition.wallet_balance * entryPrice) * 9.7)

    let orderResponse = await openLimitOrder({
      qty: targetQty,
      price: entryPrice,
      side,
    })
    console.log(chalk.grey(`Opened new order at ${entryPrice}`))

    const replaceOrderUntilFilled = () => {
      if (this.cancelAllOrders) return

      setTimeout(async () => {
        BTCPosition = getPosition()

        if (BTCPosition.size >= targetQty) {
          console.log(chalk.green(`${side} for ${targetQty} filled\n`))
          await exitPositionWithLimitAtXPercent({ percent: 1 })
          return
        }

        if (orderResponse.ret_msg && orderResponse.ret_msg.includes('cannot cover by estimated max_affordable_oc')) {
          targetQty -= .1
        }
        const activeOrders = getActiveOrders()
        const newEntryPrice = getEntryPrice(side)

        if (activeOrders.length > 0) {
          let cancelledOrderQtys = 0
          for (order of activeOrders) {
            if (
              (order.side === 'Sell' && newEntryPrice < order.price) ||
              (order.side === 'Buy' && newEntryPrice > order.price)
            ) {
              await cancelActiveOrder(order.order_id)
              cancelledOrderQtys += order.qty
              console.log(chalk.grey(`Cancelled order at ${order.price}`))
            }
          }
          if (cancelledOrderQtys > 0) {
            orderResponse = await openLimitOrder({
              qty: Math.floor(cancelledOrderQtys),
              price: newEntryPrice,
              side,
            })
            console.log(chalk.grey(`Opened new order at ${newEntryPrice}`))
          }
        } else {
          if (targetQty > Math.ceil(BTCPosition.size)) targetQty = Math.floor(targetQty - Math.ceil(BTCPosition.size))
          orderResponse = await openLimitOrder({
            qty: targetQty,
            price: newEntryPrice,
            side,
          })
          console.log(chalk.grey(`Opened new order at ${newEntryPrice}`))
        }

        return replaceOrderUntilFilled()
      }, 1500)
    }

    replaceOrderUntilFilled()
  }

  getEntryPrice(side) {
    let { highestBuy, lowestSell } = getHighestBuyLowestSell()
    return side === 'Sell' ? +highestBuy + .5 : +lowestSell - .5
  }

  openLimitOrder({ qty, price, side }) {
    return openOrder({
      order_type: 'Limit',
      price,
      qty,
      side,
      symbol: 'BTCUSD',
      time_in_force: 'PostOnly',
    })
  }

  openMarketOrder({ qty, side }) {
    return openOrder({
      order_type: 'Market',
      price: '',
      qty,
      side,
      symbol: 'BTCUSD',
      time_in_force: '',
    })
  }

}
