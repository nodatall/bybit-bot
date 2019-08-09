const positions = {}

function setPosition(positionData) {
  positionData.forEach(position => {
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
