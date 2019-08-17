exports.up = async db => {
  await db.runSql(
    `
      CREATE TABLE orderbook (
        id integer PRIMARY KEY,
        price text NOT NULL,
        symbol text NOT NULL,
        side text NOT NULL,
        size integer NOT NULL
      )
    `
  )
}

exports.down = () => {
  throw new Error('No going back')
}
