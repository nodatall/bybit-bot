const { oneMinSSL, threeMinSSL } = require('./ssl')

setInterval(async () => {
  const oneMinResult = await oneMinSSL()
  console.log(`oneMinResult -->`, oneMinResult)
  const threeMinResult = await threeMinSSL()
  console.log(`threeMinResult -->`, threeMinResult)
}, 1000)
