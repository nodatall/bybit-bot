exports.up = async db => {
  await db.runSql(
    `
      CREATE TABLE orderbook (
        id integer PRIMARY KEY,
        price text NOT NULL,
        symbol text NOT NULL,
        side text NOT NULL,
        size integer NOT NULL
      );

      CREATE TABLE position (
        id integer PRIMARY KEY,
        symbol text NOT NULL,
        side text NOT NULL,
        size decimal NOT NULL,
        position_value decimal NOT NULL,
        entry_price decimal NOT NULL,
        leverage integer NOT NULL,
        liq_price decimal NOT NULL,
        wallet_balance decimal NOT NULL
      );

      CREATE TABLE orders (
        order_id text PRIMARY KEY,
        symbol text NOT NULL,
        side text NOT NULL,
        price decimal NOT NULL,
        qty decimal NOT NULL,
        time_in_force text NOT NULL
      );

      CREATE TABLE candles (
        symbol text NOT NULL,
        open_time integer PRIMARY KEY,
        open decimal NOT NULL,
        high decimal NOT NULL,
        low decimal NOT NULL,
        close decimal NOT NULL,
        volume decimal NOT NULL,
        turnover decimal NOT NULL
      )
    `
  )
}

exports.down = () => {
  throw new Error('No going back')
}
