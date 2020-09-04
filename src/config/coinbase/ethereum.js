import coin from './coin'
const MAINNET = 'https://bsc-dataseed1.binance.org:443'
const MAIN_CHAINID = 56
const TESTNET = ' https://data-seed-prebsc-1-s1.binance.org:8545'
const TEST_CHAINID = 97
const ANY_MAIN_TOKEN = ''
const ANY_TEST_TOKEN = '0x6fb8125c42a53dced3c4c05e1712e4c5ca1c6dc2'
const COIN_BASE ={
  symbol: 'BNB',
  name: 'Binance',
  testUrl: '',
  mainUrl: '',
  decimals: 18
}
let coinConfig = {
  ...COIN_BASE,
  nodeRpc: MAINNET,
  chainID: MAIN_CHAINID,
  any: {
    token: ANY_MAIN_TOKEN,
    exchange: ''
  },
  coininfo: {
    // [coin.BTC]: {url: 'https://testnet.smpcwallet.com/btc2fsn'},
    [coin.ETH]: {url: ''},
    [coin.USDT]: {url: ''},
  },
  initToken: ANY_MAIN_TOKEN,
  initBridge: '',
  explorerUrl: 'https://fsnex.com',
}

function getBNBConfig (type) {
  if (type.toLowerCase() === 'main') {
    return coinConfig
  }
  coinConfig = {
    ...COIN_BASE,
    nodeRpc: TESTNET,
    chainID: TEST_CHAINID,
    any: {
      token: ANY_TEST_TOKEN,
      exchange: '0x72b60cae10b8b921c648c04acd66104f25de7994'
    },
    coininfo: {
      // [coin.BTC]: {url: 'https://testnet.smpcwallet.com/btc2fsn'},
      [coin.ETH]: {url: ''},
      [coin.USDT]: {url: ''},
    },
    initToken: ANY_MAIN_TOKEN,
    initBridge: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    explorerUrl: 'https://explorer.binance.org/smart-testnet'
  }
  return coinConfig
}

export default getBNBConfig