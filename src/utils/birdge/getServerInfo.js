import axios from 'axios'
import config from '../../config'

const SERVER_BRIDGE_CONFIG = 'SERVER_BRIDGE_CONFIG'
const SERVER_BRIDGE_REGISTER = 'SERVER_BRIDGE_REGISTER'

function getLocalConfig (account, token, chainID) {
  let lstr = sessionStorage.getItem(SERVER_BRIDGE_CONFIG)
  if (!lstr) {
    return false
  } else {
    let lboj = JSON.parse(lstr)
    if (!lboj[chainID]) {
      return false
    } else if (!lboj[chainID][account]) {
      return false
    } else if (!lboj[chainID][account][token]) {
      return false
    } else if ((Date.now() - lboj[chainID][account][token].timestamp) > (1000 * 60 * 10)) {
      return false
    } else {
      return {
        msg: 'Success',
        info:lboj[chainID][account][token]
      }
    }
  }
}

function setLocalConfig (account, token, serverInfo, chainID) {
  let lstr = sessionStorage.getItem(SERVER_BRIDGE_CONFIG)
  let lboj = {}
  if (!lstr) {
    lboj[chainID] = {}
    lboj[chainID][account] = {}
    lboj[chainID][account][token] = {
      ...serverInfo,
      timestamp: Date.now()
    }
  } else {
    lboj = JSON.parse(lstr)
    if (!lboj[chainID]) {
      lboj[chainID] = {}
      lboj[chainID][account] = {}
      lboj[chainID][account][token] = {
        ...serverInfo,
        timestamp: Date.now()
      }
    } else if (!lboj[chainID][account]) {
      lboj[chainID][account] = {}
      lboj[chainID][account][token] = {
        ...serverInfo,
        timestamp: Date.now()
      }
    } else {
      lboj[chainID][account][token] = {
        ...serverInfo,
        timestamp: Date.now()
      }
    }
  }
  sessionStorage.setItem(SERVER_BRIDGE_CONFIG, JSON.stringify(lboj))
}

export function removeLocalConfig (account, token, chainId) {
  let lstr = sessionStorage.getItem(SERVER_BRIDGE_CONFIG)
  if (lstr) {
    let lboj = JSON.parse(lstr)
    lboj[chainId][account][token] = undefined
    sessionStorage.setItem(SERVER_BRIDGE_CONFIG, JSON.stringify(lboj))
  }
}


function getRegisterInfo (account, token, chainID) {
  let lrInfo = localStorage.getItem(SERVER_BRIDGE_REGISTER)
  if (!lrInfo) {
    return false
  } else {
    let lrObj = JSON.parse(lrInfo)
    if (!lrObj[chainID] || !lrObj[chainID][account] || !lrObj[chainID][account][token]) {
      return false
    }
    return lrObj[chainID][account][token]
  }
}

function setRegisterInfo (account, token, localInfo, chainID) {
  let lstr = localStorage.getItem(SERVER_BRIDGE_REGISTER)
  let lboj = {}
  if (!lstr) {
    // console.log(1)
    lboj[chainID] = {}
    lboj[chainID][account] = {}
    lboj[chainID][account][token] = {
      ...localInfo,
      timestamp: Date.now()
    }
  } else {
    lboj = JSON.parse(lstr)
    if (!lboj[chainID]) {
      lboj[chainID] = {}
      lboj[chainID][account] = {}
      lboj[chainID][account][token] = {
        ...localInfo,
        timestamp: Date.now()
      }
    } else if (!lboj[chainID][account]) {
      // console.log(3)
      lboj[chainID] = {}
      lboj[chainID][account] = {}
      lboj[chainID][account][token] = {
        ...localInfo,
        timestamp: Date.now()
      }
    } else {
      // console.log(4)
      lboj[chainID][account][token] = {
        ...localInfo,
        timestamp: Date.now()
      }
    }
  }
  // console.log(lboj)
  localStorage.setItem(SERVER_BRIDGE_REGISTER, JSON.stringify(lboj))
  // console.log(localStorage.getItem(SERVER_BRIDGE_REGISTER))
}

export function removeRegisterInfo (account, token, chainID) {
  let lstr = localStorage.getItem(SERVER_BRIDGE_REGISTER)
  if (lstr) {
    let lboj = JSON.parse(lstr)
    lboj[chainID][account][token] = undefined
    localStorage.setItem(SERVER_BRIDGE_REGISTER, JSON.stringify(lboj))
  }
}

function setLocalinfo (account, res, chainID) {
  let dObj = res.SrcToken, // 充值信息
      rObj = res.DestToken // 提现信息
  let bridgeData = {
    depositAddress: dObj.DepositAddress,
    PlusGasPricePercentage: dObj.PlusGasPricePercentage,
    isDeposit: !dObj.DisableSwap ? 1 : 0,
    depositMaxNum: dObj.MaximumSwap,
    depositMinNum: dObj.MinimumSwap,
    depositBigValMoreTime: dObj.BigValueThreshold,
    outnetToken: dObj.ContractAddress,
    dcrmAddress: dObj.DcrmAddress,
    isRedeem: !rObj.DisableSwap ? 1 : 0,
    redeemMaxNum: rObj.MaximumSwap,
    redeemMinNum: rObj.MinimumSwap,
    maxFee: rObj.MaximumSwapFee,
    minFee: rObj.MinimumSwapFee,
    fee: rObj.SwapFeeRate,
    redeemBigValMoreTime: rObj.BigValueThreshold,
    token: rObj.ContractAddress,
    p2pAddress: getRegisterInfo(account, rObj.ContractAddress, chainID).p2pAddress
  }
  // console.log(rObj.ContractAddress)
  setLocalConfig(account, rObj.ContractAddress, bridgeData, chainID)
}

function getServerData (account, chainID, version) {
  return new Promise(resolve => {
    let url = config.serverInfoUrl['V1'] + '/serverInfo/' + chainID
    if (version === 'V2') {
      url = config.serverInfoUrl['V2'] + '/serverInfo/' + chainID
    }
    let data = {
      msg: 'Error',
      info: ''
    }
    axios.get(url).then(res => {
      // console.log(res)
      if(res.status === 200){
        data = {
          msg: 'Success',
          info: res.data.result
        }
        let serverData = res.data
        for (let obj in serverData) {
          setLocalinfo(account, serverData[obj], chainID)
        }
      }
      resolve(data)
    }).catch(err => {
      console.log(err)
      data.error = err
      resolve(data)
    })
  })
}

function RegisterAddress(account, token, coin, chainID, version) {
  return new Promise(resolve => {
    let data = {
      msg: 'Error',
      info: ''
    }
    let url = config.serverInfoUrl['V1'] + '/register/' + account + '/' + chainID + '/' + coin
    if (version === 'V2') {
      url = config.serverInfoUrl['V2'] + '/register/' + account + '/' + chainID + '/' + coin
    }
    axios.get(url).then(res => {
      let rsData = res.data
      if ( 
        (rsData.msg === 'Success' && rsData.info && rsData.info.P2shAddress)
        || (rsData.error && rsData.error.indexOf('mgoError: Item is duplicate') !== -1)
      ) {
        setRegisterInfo(account, token, {
          isRegister: true,
          p2pAddress: rsData.info && rsData.info.P2shAddress
        }, chainID)
        resolve({
          msg: 'Success',
          info: ''
        })
      } else {
        data.error = 'Register error!'
        resolve(data)
      }
    }).catch(err => {
      console.log(err)
      data.error = err
      resolve(data)
    })
  })
}

let getInfoObj = {}
// let count = 0
// let count1 = 0
export function getServerInfo (account, token, coin, chainID, version) {
  getInfoObj = {account, token, coin}
  // count ++
  return new Promise(resolve => {
    if (!account) {
      resolve('')
    } else {
      let lrInfo = getRegisterInfo(account, token, chainID)
      if (!lrInfo) {
        RegisterAddress(account, token, coin, chainID, version).then(res => {
          if (res.msg === 'Success') {
            let lData = getLocalConfig(getInfoObj.account, getInfoObj.token, chainID)
            if (lData) {
              resolve(lData)
            } else {
              getServerData(account, chainID, version).then(result => {
                let lData1 = getLocalConfig(getInfoObj.account, getInfoObj.token, chainID)
                if (lData1) {
                  resolve(lData1)
                } else {
                  resolve({
                    msg: 'Null'
                  })
                }
              })
            }
          } else {
            resolve(res)
          }
        })
      } else {
        if (!getLocalConfig(account, token, chainID)) {
          getServerData(account, chainID, version).then(result => {
            let lData = getLocalConfig(getInfoObj.account, getInfoObj.token, chainID)
            if (lData) {
              resolve(lData)
            } else {
              resolve({
                msg: 'Null'
              })
            }
          })
        } else {
          resolve(getLocalConfig(account, token, chainID))
        }
      }
    }
  })
}