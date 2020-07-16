import axios from 'axios'
import { resolve } from 'path'

const NETWORK_URL =
  process.env.REACT_APP_IS_PRODUCTION_DEPLOY === 'true'
    ? process.env.REACT_APP_NETWORK_URL_PROD
    : process.env.REACT_APP_NETWORK_URL

export const GetServerInfo = (url) => {
  return new Promise(resolve => {
    axios.post(url, {
      id:0,
      jsonrpc:"2.0",
      method:"swap.GetServerInfo",
      params:[]
    }).then((res) => {
      if(res.status === 200){
        let data = res.data.result
        resolve({
          swapInfo: data
        })
      }else{
        resolve({
          swapInfo: {}
        })
      }
    }).catch(err => {
      console.log(err)
      resolve({
        swapInfo: {}
      })
    })
  })
}

export const RegisterAddress = (url, address) => {
  return new Promise(resolve => {
    axios.post(url, {
      id:0,
      jsonrpc:"2.0",
      method:"swap.RegisterP2shAddress",
      params:[address]
    }).then(res => {
      // console.log(res)
      resolve(res.data)
    }).catch(err => {
      console.log(err)
      resolve(err)
    })
  })
}

function GetTxnStatusAPI (url, hash) {
  return new Promise(resolve => {
    axios.post(url, {
      id:0,
      jsonrpc:"2.0",
      method:"swap.GetSwapin",
      params:[hash]
    }).then(res => {
      // console.log(res)
      resolve(res.data)
    }).catch(err => {
      console.log(err)
      resolve(err)
    })
  })
}

function GetAddressTxnStatusAPI (url, address) {
  return new Promise(resolve => {
    axios.post(url, {
      id:0,
      jsonrpc:"2.0",
      method:"swap.GetSwapin",
      params:[address]
    }).then(res => {
      // console.log(res)
      resolve(res.data)
    }).catch(err => {
      console.log(err)
      resolve(err)
    })
  })
}

function GetBTCTxnsAPI (url) {
  return new Promise(resolve => {
    axios.get(url).then(res => {
      // console.log(res)
      resolve(res.data)
    }).catch(err => {
      console.log(err)
      resolve(err)
    })
  })
}

export const GetBTCtxnsAll = (url, address, coin, dec) => {
  // let url = `https://sochain.com/api/v2/get_tx_unspent/BTC/${address}` // 主网
  let sochainUrl = `https://sochain.com/api/v2/get_tx_received/BTCTEST/${address}` // 测试网
  let cbData = {
    mintTip: false,
    mintValue: 0,
    mintHash: '',
    status: '',
    from: ''
  }
  if (['mETH', 'mUSDT'].includes(coin)) {
    return new Promise(resolve => {
      GetAddressTxnStatusAPI(url, address).then(txns => {
        // console.log(txns)
        if (txns.result) {
          // cbData.mintValue = useTxns.value
          // cbData.mintTip = true
          // cbData.mintHash = useTxns.txid
          // cbData.status = txns.result.status
          // cbData.from = txns.result.from
          txns.result = txns.result[0]
          if ([0,5,7,8,9].includes(txns.result.status)) {
            cbData.mintValue = Number((txns.result.value / Math.pow(10, dec)).toFixed(16))
            cbData.mintTip = true
            cbData.mintHash = txns.result.txid
            cbData.status = txns.result.status
            cbData.from = txns.result.from
          } else {
            cbData.mintTip = false
          }
        } else {
          cbData.mintTip = false
        }
        resolve(cbData)
      })
    })
  } 
  return new Promise(resolve => {
    GetBTCTxnsAPI(sochainUrl).then(res => {
      // console.log(res)
      if (res.status === "success" && res.data && res.data.txs.length > 0) {
        let useTxns = res.data.txs[res.data.txs.length - 1]
        GetTxnStatusAPI(url, useTxns.txid).then(txns => {
          // console.log(txns)
          if (txns.result) {
            // cbData.mintValue = useTxns.value
            // cbData.mintTip = true
            // cbData.mintHash = useTxns.txid
            // cbData.status = txns.result.status
            // cbData.from = txns.result.from
            if ([0,5,7,8,9].includes(txns.result.status)) {
              cbData.mintValue = useTxns.value
              cbData.mintTip = true
              cbData.mintHash = useTxns.txid
              cbData.status = txns.result.status
              cbData.from = txns.result.from
            } else {
              cbData.mintTip = false
            }
          } else {
            cbData.mintTip = false
          }
          resolve(cbData)
        })
      } else {
        cbData.mintTip = false
        resolve(cbData)
      }
    })
  })
}

export const getAxiosData = (method, params) => {
  return new Promise(resolve => {
    axios.post(NETWORK_URL, {
      id:0,
      jsonrpc:"2.0",
      method:method,
      params:params
    }).then(res => {
      // console.log(res)
      resolve(res.data)
    }).catch(err => {
      console.log(err)
      resolve(err)
    })
  })
}

const FSN_PRICE = 'FSN_PRICE'
function getFSNprics () {
  let url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=fsn&order=market_cap_desc&per_page=100&page=1&sparkline=false'
  return new Promise(resolve => {
    axios.get(url).then(res => {
      // console.log(res)
      if (res && res.data && res.data.length > 0) {
        let price = res.data[0].current_price
        localStorage.setItem(FSN_PRICE, JSON.stringify({
          timestamp: Date.now(),
          price: price
        }))
        resolve({
          msg: 'Success',
          price: price
        })
      } else {
        localStorage.setItem(FSN_PRICE, '')
        resolve({
          msg: 'Error',
          price: ''
        })
      }
    }).catch(err => {
      console.log(err)
      localStorage.setItem(FSN_PRICE, '')
      resolve({
        msg: 'Error',
        price: ''
      })
    })
  })
}
export const getPrice = () => {
  let localFSNPrice = localStorage.getItem(FSN_PRICE)
  // console.log(localFSNPrice)
  return new Promise(resolve => {
    if (localFSNPrice) {
      let localObj = JSON.parse(localFSNPrice)
      if (Date.now() - Number(localObj.timestamp) > (1000 * 60 * 60) || !localObj.price) {
        getFSNprics().then(res => {
          if (res.msg === 'Success') {
            resolve(res.price)
          } else {
            resolve('')
          }
        })
      } else {
        resolve(localObj.price)
      }
    } else {
      getFSNprics().then(res => {
        if (res.msg === 'Success') {
          resolve(res.price)
        } else {
          resolve('')
        }
      })
    }
  })
}