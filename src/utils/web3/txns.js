import web3Fn from './index'
import EXCHANGE_ABI from '../../constants/abis/exchange.json'
import {toSign as toLedgerSign} from '../wallets/ledger/index'

const CHAINID =
  process.env.REACT_APP_IS_PRODUCTION_DEPLOY === 'true'
    ? process.env.REACT_APP_CHAIN_ID
    : process.env.REACT_APP_CHAIN_ID

export function getWeb3ConTract (ABI, ContractAddress) {
  // console.log(web3Fn)
  ABI = ABI ? ABI : EXCHANGE_ABI
  // return new web3Fn.eth.contract(EXCHANGE_ABI, ContractAddress)
  let contract = web3Fn.eth.contract(ABI) 
  return contract.at(ContractAddress)
}

export function getWeb3BaseInfo (ContractAddress, DcrmAddress, input, address, value) {
  let walletType = sessionStorage.getItem('walletType')
  let HDPath = sessionStorage.getItem('HDPath')
  let data = {
    chainId: web3Fn.toHex(CHAINID),
    from: address,
    gas: '',
    gasPrice: "",
    nonce: "",
    to: ContractAddress,
    value: value ? value : "0x0",
    data: input
  }
  console.log(data)
  return new Promise(resolve => {
    const batch = web3Fn.createBatch()
    batch.add(web3Fn.eth.estimateGas.request({to: ContractAddress}))
    batch.add(web3Fn.eth.getTransactionCount.request(address))
    batch.add(web3Fn.eth.getGasPrice.request())
    batch.requestManager.sendBatch(batch.requests, (err, results) => {
      data.gas = results[0].result ? web3Fn.toHex(results[0].result * 6) : web3Fn.toHex(12600 * 6)
      data.nonce = results[1].result ? web3Fn.toHex(results[1].result) : web3Fn.toHex(0)
      data.gasPrice = results[2].result ? web3Fn.toHex(results[2].result) : web3Fn.toHex(100000)
      toLedgerSign(HDPath, data).then(res => {
        // resolve(data)
        console.log(res)
        if (res.msg === 'Success') {
          web3Fn.eth.sendRawTransaction(res.info.signedTx, (err, hash) => {
            console.log(hash)
            if (err) {
              resolve({
                msg: 'Error',
                error: err
              })
            } else {
              data.hash = hash
              resolve({
                msg: 'Success',
                info: data
              })
            }
          })
        } else {
          resolve({
            msg: 'Error',
            error: res.error
          })
        }
      })
    })
  })
}