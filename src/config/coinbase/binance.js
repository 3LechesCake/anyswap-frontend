import {getBaseCoin} from './coin'
import {
  BNB_MAINNET,
  BNB_MAIN_CHAINID,
  BNB_MAIN_EXPLORER,
  BNB_TESTNET,
  BNB_TEST_CHAINID,
  BNB_TEST_EXPLORER,
} from './nodeConfig'


const COIN = getBaseCoin()
const ANY_MAIN_TOKEN = 'ANY'
const ANY_TEST_TOKEN = '0x4ce47351aeafbd81f9888187288996fe0322ffa2'

const COIN_BASE ={
  symbol: 'BNB',
  name: 'Binance-BEP20',
  testUrl: 'https://bsctest.anyswap.exchange',
  mainUrl: 'https://bsc.anyswap.exchange',
  decimals: 18,
  networkNamr: 'BSC'
}
const INIT_MAIN_TOKEN = '0x55d398326f99059ff775485246999027b3197955'
const INIT_TEST_TOKEN = ANY_TEST_TOKEN
let coinConfig = {
  ...COIN_BASE,
  nodeRpc: BNB_MAINNET,
  chainID: BNB_MAIN_CHAINID,
  any: {
    token: ANY_MAIN_TOKEN
  },
  coininfo: {
    // [COIN.BTC]: {url: 'https://testnet.smpcwallet.com/btc2fsn'},
    [COIN.ETH]: {url: ''},
    [COIN.USDT]: {url: ''},
  },
  initToken: INIT_MAIN_TOKEN,
  initBridge: 'BTC',
  explorerUrl: BNB_MAIN_EXPLORER,
  marketsUrl: '',
  document: 'https://anyswap-faq.readthedocs.io/en/latest/index.html',
  btcConfig: {
    lookHash: 'https://sochain.com/tx/BTCTEST/',
    queryTxns: 'https://sochain.com/api/v2/get_tx_received/BTC/',
    queryHashStatus: 'https://sochain.com/api/v2/get_confidence/BTC/',
    btcAddr: ''
  },
  isOPenBridge: 0,
  isOpenRewards: 0,
  isChangeDashboard: 0,
  noSupportBridge: [
    COIN_BASE.symbol,
    '0xae9269f27437f0fcbc232d39ec814844a51d6b8f',
    '0x55d398326f99059ff775485246999027b3197955',
    '0xacd6b5f76db153fb45eae6d5be5bdbd45d1b2a8c',
    '0xE4Ae305ebE1AbE663f261Bc00534067C80ad677C',
    '0x8E9f5173e16Ff93F81579d73A7f9723324d6B6aF'
  ],
}

function getBNBConfig (type) {
  if (type.toLowerCase() === 'main') {
    return coinConfig
  }
  coinConfig = {
    ...COIN_BASE,
    nodeRpc: BNB_TESTNET,
    chainID: BNB_TEST_CHAINID,
    any: {
      token: ANY_TEST_TOKEN
    },
    coininfo: {
      // [COIN.BTC]: {url: 'https://testnet.smpcwallet.com/btc2fsn'},
      [COIN.ETH]: {url: ''},
      [COIN.USDT]: {url: ''},
      ANY: {url: 'https://testany2bscapi.anyswap.exchange/rpc'},
    },
    initToken: INIT_TEST_TOKEN,
    initBridge: '0x4ce47351aeafbd81f9888187288996fe0322ffa2',
    explorerUrl: BNB_TEST_EXPLORER,
    marketsUrl: 'https://markets.anyswap.exchange/#/',
    document: 'https://anyswap-faq.readthedocs.io/en/latest/index.html',
    btcConfig: {
      lookHash: 'https://sochain.com/tx/BTCTEST/',
      queryTxns: 'https://sochain.com/api/v2/get_tx_received/BTCTEST/',
      queryHashStatus: 'https://sochain.com/api/v2/get_confidence/BTCTEST/',
      btcAddr: ''
    },
    isOPenBridge: 1,
    isOpenRewards: 0,
    isChangeDashboard: 0,
    noSupportBridge: [COIN_BASE.symbol]
  }
  return coinConfig
}

export default getBNBConfig