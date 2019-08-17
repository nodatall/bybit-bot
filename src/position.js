const positions = {}

function setPosition(positionData) {
  positionData.forEach(position => {
    // update, don't replace
    // also make sure wallet_balance updates after trades
    if (position.symbol === 'BTCUSD') {
      positions.BTCUSD = position
    }
  })
}

function getPosition(symbol = 'BTCUSD') {
  return positions[symbol]
}

module.exports = {
  setPosition,
  getPosition,
}
