require('dotenv').config()

const path = require('path')
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

if (process.env.DOTENV !== '0'){
  require('dotenv').config({
    path: path.resolve(__dirname, `.${process.env.NODE_ENV}.env`)
  })
}
