import React, { useState, useReducer, useEffect, useCallback } from 'react'
// import ReactGA from 'react-ga'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { useWeb3React, useSwapTokenContract } from '../../hooks'
import { amountFormatter, isAddress } from '../../utils'

// import { useExchangeContract } from '../../hooks'
import { useTokenDetails, INITIAL_TOKENS_CONTEXT, useAllTokenDetails } from '../../contexts/Tokens/index.js'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressBalance } from '../../contexts/Balances'
import { useWalletModalToggle } from '../../contexts/Application'

import { Button, TitleBox, Spinner } from '../../theme'
import CurrencyInputPanel from '../CurrencyInputPanel'
import AddressInputPanel from '../AddressInputPanel'
import OversizedPanel from '../OversizedPanel'
// import TransactionDetails from '../TransactionDetails'
import WarningCard from '../WarningCard'
import { transparentize } from 'polished'
import WalletConnectData from '../WalletModal/WalletConnectData'
import Modal from '../Modal'
import { ReactComponent as QRcode } from '../../assets/images/QRcode.svg'
import TokenLogo from '../TokenLogo'


import config from '../../config'
import {formatCoin, formatDecimal} from '../../utils/tools'
import {getWeb3ConTract, getWeb3BaseInfo} from '../../utils/web3/txns'
import swapBTCABI from '../../constants/abis/swapBTCABI'
import swapETHABI from '../../constants/abis/swapETHABI'

import HardwareTip from '../HardwareTip'
import ResertSvg from '../../assets/images/icon/revert.svg'
import BirdgeIcon from '../../assets/images/icon/bridge-white.svg'
import BirdgeBtnIcon from '../../assets/images/icon/bridge-white-btn.svg'
import WarningIcon from '../../assets/images/icon/warning.svg'
import BulbIcon from '../../assets/images/icon/bulb.svg'
import DepositIcon from '../../assets/images/icon/deposit.svg'
import DepositActiveIcon from '../../assets/images/icon/deposit-purple.svg'
import WithdrawIcon from '../../assets/images/icon/withdraw.svg'
import WithdrawActiveIcon from '../../assets/images/icon/withdraw-purple.svg'
import ScheduleIcon from '../../assets/images/icon/schedule.svg'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import Circle from '../../assets/images/circle.svg'

import Copy from '../AccountDetails/Copy'
import { useBetaMessageManager } from '../../contexts/LocalStorage'
import WarningTip from '../WarningTip'

import {HDsendERC20Txns, MMsendERC20Txns, getHashStatus, getWithdrawHashStatus} from '../../utils/web3/BridgeWeb3'
import BridgeTokens from '../../contexts/BridgeTokens'

import {createBTCaddress, isBTCAddress, GetBTCtxnsAll, GetBTChashStatus} from '../../utils/birdge/BTC'
// import { GetServerInfo, RegisterAddress } from '../../utils/birdge'

import {getServerInfo, removeLocalConfig, getRegisterInfo} from '../../utils/birdge/getServerInfo'

import {getAllOutBalance, getLocalOutBalance} from '../../utils/birdge/getOutBalance'

import {recordTxns} from '../../utils/records'

const INPUT = 0
const OUTPUT = 1

const DownArrowBackground = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
  margin: 3px auto;
  cursor:pointer;
  background: ${({ theme }) => theme.swapBg}
`

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;

  button {
    max-width: 20rem;
  }
`
const InputPanel = styled.div`
${({ theme }) => theme.flexColumnNoWrap}
box-shadow: 0 0.25rem 8px 0 ${({ theme }) => transparentize(0.95, theme.shadowColor)};
position: relative;
border-radius: 1.25rem;
background: ${({theme}) => theme.contentBg};
z-index: 1;
padding: 1.5625rem 2.5rem;
margin-top: 0.625rem;
@media screen and (max-width: 960px) {
  padding: 1rem 1.5625rem;
}
`

const ContainerRow = styled.div`
display: flex;
justify-content: center;
align-items: center;
`

const InputContainer = styled.div`
flex: 1;
`

const LabelRow = styled.div`
${({ theme }) => theme.flexRowNoWrap}
align-items: center;
color: ${({ theme }) => theme.doveGray};
font-size: 0.75rem;
font-family: 'Manrope';
line-height: 1rem;
padding: 0.75rem 0;
`

const LabelContainer = styled.div`
flex: 1 1 auto;
width: 0;
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
`

const InputRow = styled.div`
${({ theme }) => theme.flexRowNoWrap}
align-items: center;
padding: 0.25rem 0rem 0.75rem;
`

const Input = styled.input`
outline: none;
border: none;
flex: 1 1 auto;
width: 0;
background-color: transparent;
border-bottom: 0.0625rem solid ${({theme}) => theme.inputBorder};

color: ${({ error, theme }) => (error ? theme.salmonRed : theme.textColorBold)};
overflow: hidden;
text-overflow: ellipsis;
font-family: 'Manrope';
font-size: 24px;
font-weight: 500;
font-stretch: normal;
font-style: normal;
line-height: 1;
letter-spacing: -0.0625rem;
padding: 8px 0.75rem;
::placeholder {
  color: ${({ theme }) => theme.placeholderGray};
}
`

const MintDiv = styled.div`
  width: 100%;
  padding: 1.25rem 1rem;
`

const MintList = styled.div`
  border-bottom: 0.0625rem  solid ${({ error, theme }) => (error ? theme.salmonRed : theme.mercuryGray)};
  padding: 8px 8px;
  font-family: 'Manrope';
  font-size: 0.875rem;
`
const MintListCenter = styled(MintList)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.875rem;
`

const MintListLabel = styled.div`
  width: 100%;
  font-size:12px;
  color:#96989e;
`

const MintListVal = styled.div`
${({ theme }) => theme.FlexSC};
  width: 100%;
  cursor:pointer
  color:${({ theme }) => theme.textColorBold};
  font-size:12px;
  .green {
    color: green
  }
  .red {
    color: red
  }
  .link {
    color:${({ theme }) => theme.textColorBold};
  }
`

const TokenLogoBox = styled(TokenLogo)`
  // padding: 0.625rem;
  background: none;
`

const MintTip = styled.div`
  position: fixed;
  top: 100px;
  right: 80px;
  border-radius: 0.25rem;
  box-shadow:0 0 5px 0px #E1902E;
  z-index: 99;
  cursor:pointer;
  .txt {
    width: 0;height: 100%;white-space: nowrap;overflow: hidden;transition: width 0.5s;
  }
  &:hover {
    .txt {
      width: 150px;padding: 0 1.25rem;
    }
  }
`

const MintHahshList = styled.div`
  position:fixed;
  top:100px;
  right:20px;
  z-index: 99;
  cursor:pointer;
  margin:0;
  ul {
    list-style:none;
    cursor:pointer;
    margin:0;
    padding:15px;
    max-height: 200px;
    overflow:auto;
    li {
      border-radius: 0.25rem;
      box-shadow:0 0 5px 0px #E1902E;
      margin:0 0 20px;
      padding: 5px;
      position:relative;
      img {
        display:block;
      }
      .txt {
        width: 0;height: 100%;white-space: nowrap;overflow: hidden;transition: width 0.5s;
      }
      .del {
        ${({ theme }) => theme.FlexC};
        position:absolute;
        top: -9px;
        right:-9px;
        width: 18px;
        height: 18px;
        border:1px solid #ddd;
        border-radius:100%;
        background: rgba(0,0,0,.1);
        line-height:1;
        font-size:12px;
        color:#fff;
        opacity: 0;
      }
      &:hover {
        .txt {
          width: 150px;padding: 0 1.25rem;
        }
        .del {
          opacity: 1;
        }
      }
    }
  }
  .delete {
    ${({ theme }) => theme.FlexC};
    width:100%;
    background: rgba(0,0,0,.1);
  }
`

const FlexCneter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  button {
    max-width: 20rem;
  }
`

const StyledQRcode = styled(QRcode)`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  cursor:pointer;
  margin-left: 0.625rem;
`

const MintWarningTip = styled.div`
${({ theme }) => theme.FlexSC};
  padding: 0.625rem 1rem;
  width: 100%;
  // color:red;
  
  color: ${({ theme }) => theme.tipColor};
  font-family: 'Manrope';
  cursor: pointer;
  flex: 1 0 auto;
  align-items: center;
  position: relative;
  padding: 0.5rem 1rem;
  padding-right: 2rem;
  // margin-bottom: 1rem;
  // border: 0.0625rem solid ${({ theme }) => transparentize(0.6, 'red')};
  // background-color: ${({ theme }) => transparentize(0.9, 'red')};
  
  border: solid 0.5px ${({ theme }) => theme.tipBorder};
  background-color: ${({ theme }) => theme.tipBg};
  border-radius: 1rem;
  font-size: 0.75rem;
  line-height: 1rem;
  text-align: left;
  margin-top: 10px;
  
  flex-wrap:wrap;
  line-height: 1rem;
  .span {
    text-decoration: underline;
    margin: 0 5px;
  }
  a {
    display:inline-block;
    overflow:hidden;
    height: 1rem;
  }
`

// const StyledCopyICON = styled(copyICON)`
//   width: ${({ size }) => size};
//   height: ${({ size }) => size};
//   margin: 0 0.625rem;
//   cursor:pointer;
// `

const StyledBirdgeIcon = styled.div`
  ${({ theme }) => theme.FlexC};
  img {
    margin-right: 1rem
  }
`

const SubCurrencySelectBox = styled.div`
  width: 100%;
  object-fit: contain;
  border-radius: 0.5625rem;
  border: solid 0.5px ${({ theme }) => theme.tipBorder};
  background-color: ${({ theme }) => theme.tipBg};
  padding: 1rem 1.25rem;
  margin-top: 0.625rem;

  .tip {
    ${({ theme }) => theme.FlexSC};
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.tipColor};
    padding: 2px 20px 18px;
    border-bottom: 1px solid #f1f6fa;
    word-break:break-all;
    img {
      display:inlne-block;
    }
    p {
      ${({ theme }) => theme.FlexSC};
      flex-wrap:wrap;
      display:inline-block;
      margin: 0;
      line-height: 1rem;
      .span {
        text-decoration: underline;
        margin: 0 5px;
      }
      a {
        display:inline-block;
        overflow:hidden;
        height: 1rem;
      }
    }
  }
  .list {
    margin:0;
    padding: 0 0px 0;
    font-size: 12px;
    color: ${({ theme }) => theme.tipColor};
    dt {
      ${({ theme }) => theme.FlexSC};
      font-weight: bold;
      line-height: 1.5;
      img {
        margin-right: 8px;
      }
    }
    dd {
      font-weight: 500;
      line-height: 1.83;
      i{
        display:inline-block;
        width:4px;
        height: 4px;
        border-radius:100%;
        background:${({ theme }) => theme.tipColor};
        margin-right: 10px;
      }
    }
  }
`

const NavTabBox = styled.div`
  ${({ theme }) => theme.FlexBC};
  align-items: center;
  font-size: 1rem;
  font-family: 'Manrope';
  color: ${({ theme }) => theme.royalBlue};
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 1rem;

  img {
    height: 0.75rem;
    width: 0.75rem;
  }
`
const TabLinkBox = styled.ul`
  ${({theme}) => theme.FlexSC}
  list-style: none;
  margin: 0;
  padding:0;
  li {
    ${({ theme }) => theme.FlexC}
    height: 38px;
    font-family: 'Manrope';
    font-size: 0.75rem;
    font-weight: 500;
    font-stretch: normal;
    font-style: normal;
    letter-spacing: normal;
    color: #96989e;
    border-top: 0.0625rem solid rgba(0, 0, 0, 0.04);
    border-bottom: 0.0625rem solid rgba(0, 0, 0, 0.04);
    border-left: 0.0625rem solid rgba(0, 0, 0, 0.04);
    cursor:pointer;
    text-decoration: none;
    padding: 0 0.625rem;
    background: ${({ theme }) => theme.tabBg};
    white-space:nowrap;

    .icon {
      ${({ theme }) => theme.FlexC}
      width: 28px;
      height: 28px;
      background:#f5f5f5;
      border-radius:100%;
      margin-right:0.625rem;
    }
    &:first-child {
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
      &.active {
        border: 0.0625rem solid ${({ theme }) => theme.tabBdColor};
      }
    }
    &:last-child {
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
      border-right: 0.0625rem solid rgba(0, 0, 0, 0.04);
      &.active {
        border: 0.0625rem solid ${({ theme }) => theme.tabBdColor};
      }
    }

    &.active {
      background: ${({ theme }) => theme.tabActiveBg};
      border: 0.0625rem solid ${({ theme }) => theme.tabBdColor};
      color: ${({ theme }) => theme.tabActiveColor};
      font-weight: bold;
      .icon {
        background: #734be2;
      }
    }
    @media screen and (max-width: 960px) {
      .icon {
        display:none;
      }
    }
  }
`

const TitleBoxPool = styled(TitleBox)`
margin-bottom: 0;
`
const TokenLogoBox1 = styled.div`
  ${({ theme }) => theme.FlexC};
  width: 46px;
  height: 46px;
  background: ${ ({theme}) => theme.white};
  box-sizing:border-box;
  border-radius: 100%;
  margin-top: 15px;
  border:1px solid #ddd;
`

const DepositValue = styled.div`
width:100%;
text-align: center;
p {
  font-size:12px;
  color:#96989e;
  margin: 8px 0 8px;
}
span {
  color:${({ theme }) => theme.textColorBold};
  font-size:22px;
}
`

const HashStatus = styled.div`
  ${({ theme }) => theme.FlexBC};
  width: 100%;
  font-size:12px;
  color: ${({ theme }) => theme.textColorBold};
  font-weight:bold;
  padding: 12px 15px;
  border-radius:9px;
  margin-top:15px;
  &.yellow {
    border: 1px solid ${({ theme }) => theme.birdgeStateBorder};
    background: ${({ theme }) => theme.birdgeStateBg};
  }
  &.green{
    border: 1px solid ${({ theme }) => theme.birdgeStateBorder1};
    background: ${({ theme }) => theme.birdgeStateBg1};
  }
  &.red{
    border: 1px solid ${({ theme }) => theme.birdgeStateBorder2};
    background: ${({ theme }) => theme.birdgeStateBg2};
  }
`

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 0.875rem;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`
const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.chaliceGray};
  }
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1.5rem 1.5rem 0;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.royalBlue : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`
const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
`
const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.backgroundColor};
`


const UpperSection = styled.div`
  position: relative;
  width: 100%;
  font-family: 'Manrope';

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`
const ContentWrapper = styled.div`
width: 100%;
  background-color: ${({ theme }) => theme.backgroundColor};
  padding: 0rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const LoadingBody = styled.div`
  ${({ theme }) => theme.FlexC};
  position:fixed;
  top:0;
  left:0;
  right:0;
  bottom:0;
  z-index:9999;
  background:rgba(0,0,0,.5);
  .content {
    text-align: center;
    p {
      margin-top: 30px;
      font-size: 20px;
      color:#ccc;
    }
  }
`

const SpinnerWrapper = styled(Spinner)`
  font-size: 4rem;

  svg {
    path {
      color: ${({ theme }) => theme.uniswapPink};
    }
  }
`

const AutoDiv = styled.div`
width:100%;
height: auto;
${({ theme }) => theme.FlexC};
`

const DEPOSIT_HISTORY = 'DEPOSIT_HISTORY'
const WITHDRAW_HISTORY = 'WITHDRAW_HISTORY'
function isArray(o){
  return Object.prototype.toString.call(o) === '[object Array]'
}
function getInitialSwapState(state) {
  let wdInit = sessionStorage.getItem('WITHDRAW_HISTORY') && sessionStorage.getItem('WITHDRAW_HISTORY') !== 'undefined' ? JSON.parse(sessionStorage.getItem('WITHDRAW_HISTORY')) : {}
  let wdArr = []
  if (isArray(wdInit)) {
    wdArr = wdInit
  } else {
    wdArr = wdInit[config.chainID] ? wdInit[config.chainID] : []
  }
  let dpInit = sessionStorage.getItem('DEPOSIT_HISTORY') && sessionStorage.getItem('DEPOSIT_HISTORY') !== 'undefined' ? JSON.parse(sessionStorage.getItem('DEPOSIT_HISTORY')) : {}
  let dpArr = []
  if (isArray(dpInit)) {
    dpArr = dpInit
  } else {
    dpArr = dpInit[config.chainID] ? dpInit[config.chainID] : []
  }
  return {
    independentValue: state.exactFieldURL && state.exactAmountURL ? state.exactAmountURL : '', // this is a user input
    dependentValue: '', // this is a calculated number
    independentField: state.exactFieldURL === 'output' ? OUTPUT : INPUT,
    inputCurrency: state.inputCurrencyURL ? state.inputCurrencyURL : config.initBridge,
    outputCurrency: state.outputCurrencyURL
      ? state.outputCurrencyURL === config.symbol
        ? !state.inputCurrencyURL || (state.inputCurrencyURL && state.inputCurrencyURL !== config.symbol)
          ? config.symbol
          : ''
        : state.outputCurrencyURL
      : state.initialCurrency
      ? state.initialCurrency
      : config.initBridge,
    // hashArr: sessionStorage.getItem('DEPOSIT_HISTORY') ? JSON.parse(sessionStorage.getItem('DEPOSIT_HISTORY')) : [],
    // withdrawArr: sessionStorage.getItem('WITHDRAW_HISTORY') && sessionStorage.getItem('WITHDRAW_HISTORY') !== 'undefined' ? JSON.parse(sessionStorage.getItem('WITHDRAW_HISTORY')) : [],
    hashArr: dpArr,
    withdrawArr: wdArr,
    bridgeType: 'mint'
  }
}


function swapStateReducer(state, action) {
  switch (action.type) {
    case 'FLIP_INDEPENDENT': {
      const { independentField, inputCurrency, outputCurrency } = state
      return {
        ...state,
        dependentValue: '',
        independentField: independentField === INPUT ? OUTPUT : INPUT,
        inputCurrency: outputCurrency,
        outputCurrency: inputCurrency
      }
    }
    case 'SELECT_CURRENCY': {
      const { inputCurrency, outputCurrency } = state
      const { field, currency } = action.payload

      const newInputCurrency = field === INPUT ? currency : inputCurrency
      const newOutputCurrency = field === OUTPUT ? currency : outputCurrency

      if (newInputCurrency === newOutputCurrency) {
        return {
          ...state,
          inputCurrency: field === INPUT ? currency : '',
          outputCurrency: field === OUTPUT ? currency : ''
        }
      } else {
        return {
          ...state,
          inputCurrency: newInputCurrency,
          outputCurrency: newOutputCurrency
        }
      }
    }
    case 'UPDATE_INDEPENDENT': {
      const { field, value, realyValue } = action.payload
      const { dependentValue, independentValue } = state
      return {
        ...state,
        independentValue: value,
        dependentValue: value === independentValue ? dependentValue : '',
        independentField: field,
        realyValue: realyValue
      }
    }
    case 'UPDATE_DEPENDENT': {
      return {
        ...state,
        dependentValue: action.payload
      }
    }
    case 'UPDATE_BREDGETYPE': {
      return {
        ...state,
        bridgeType: action.payload
      }
    }
    case 'UPDATE_SWAPREGISTER': {
      if (action.token && state.inputCurrency.toLowerCase() !== action.token.toLowerCase()) {
        return state
      }
      return {
        ...state,
        registerAddress: action.payload ? action.payload : '',
        PlusGasPricePercentage: action.PlusGasPricePercentage ? action.PlusGasPricePercentage : '',
        isDeposit: action.isDeposit,
        depositMaxNum: action.depositMaxNum ? action.depositMaxNum : '',
        depositMinNum: action.depositMinNum ? action.depositMinNum : '',
        isRedeem: action.isRedeem,
        redeemMaxNum: action.redeemMaxNum ? action.redeemMaxNum : '',
        redeemMinNum: action.redeemMinNum ? action.redeemMinNum : '',
        maxFee: action.maxFee ? action.maxFee : '',
        minFee: action.minFee ? action.minFee : '',
        fee: action.fee ? action.fee : '',
        redeemBigValMoreTime: action.redeemBigValMoreTime ? action.redeemBigValMoreTime : '',
        depositBigValMoreTime: action.depositBigValMoreTime ? action.depositBigValMoreTime : '',
      }
    }
    case 'UPDATE_MINTTYPE': {
      return {
        ...state,
        isViewMintModel: action.payload
      }
    }
    case 'UPDATE_MINTHISTORY': {
      return {
        ...state,
        mintHistory: action.payload
      }
    }
    case 'UPDATE_MINTINFOTYPE': {
      return {
        ...state,
        isViewMintInfo: action.payload
      }
    }
    case 'UPDATE_HASH_STATUS': {
      const { hashData,  type, NewHashCount } = action.payload
      const { hashArr, hashCount } = state
      if (!type) {
        hashArr.push(hashData)
      }
      let arr = type ? hashData : hashArr
      let initObj = sessionStorage.getItem(DEPOSIT_HISTORY) ? JSON.parse(sessionStorage.getItem(DEPOSIT_HISTORY)) : {}
      let obj = {}
      if (isArray(initObj)) {
        obj[config.chainID] = arr
      } else {
        obj = initObj
        obj[config.chainID] = arr
      }
      sessionStorage.setItem(DEPOSIT_HISTORY, JSON.stringify(obj))
      let count = 0
      if ((hashCount || hashCount === 0) && NewHashCount) {
        count = hashCount + NewHashCount
      }
      return {
        ...state,
        hashArr: arr,
        hashCount: count
      }
    }
    case 'UPDATE_WITHDRAW_STATUS': {
      const { withdrawData,  type, NewHashCount } = action.payload
      const { withdrawArr, withdrawCount } = state
      if (!type) {
        withdrawArr.push(withdrawData)
      }
      let arr = type ? withdrawData : withdrawArr
      let initObj = sessionStorage.getItem(WITHDRAW_HISTORY) ? JSON.parse(sessionStorage.getItem(WITHDRAW_HISTORY)) : {}
      let obj = {}
      if (isArray(initObj)) {
        obj[config.chainID] = arr
      } else {
        obj = initObj
        obj[config.chainID] = arr
      }
      // console.log(obj)
      sessionStorage.setItem(WITHDRAW_HISTORY, JSON.stringify(obj))
      let count = 0
      if ((withdrawCount || withdrawCount === 0) && NewHashCount) {
        count = withdrawCount + NewHashCount
      }
      return {
        ...state,
        withdrawArr: arr,
        withdrawCount: count
      }
    }
    default: { //UPDATE_MINTINFOTYPE
      return getInitialSwapState()
    }
  }
}

function isBTC (coin) {
  if (formatCoin(coin) === 'BTC') {
    return true
  } else {
    return false
  }
}

const selfUseAllToken = config.noSupportBridge
let hashInterval

export default function ExchangePage({ initialCurrency, sending = false, params }) {
  const { t } = useTranslation()
  let { account, chainId, error } = useWeb3React()
  const [showBetaMessage] = useBetaMessageManager()
  const allTokens = useAllTokenDetails()
  let walletType = sessionStorage.getItem('walletType')
  // let HDPath = sessionStorage.getItem('HDPath')
  // account = '0x8c270c4ef7f62C6663EbCd116D4b2dc038fCF8BB'
  // console.log(allTokens)
  
  const urlAddedTokens = {}
  if (params.inputCurrency) {
    urlAddedTokens[params.inputCurrency] = true
  }
  if (params.outputCurrency) {
    urlAddedTokens[params.outputCurrency] = true
  }
  if (isAddress(initialCurrency)) {
    urlAddedTokens[initialCurrency] = true
  }


  // check URL params for recipient, only on send page
  const initialRecipient = () => {
    if (sending && params.recipient) {
      return params.recipient
    }
    return ''
  }

  // const fetchPoolTokens = useCallback(() => {
  //   if (exchangeContract) {
  //     exchangeContract.totalSupply().then(totalSupply => {
  //       setTotalPoolTokens(totalSupply)
  //     }).catch(err => {
  //       console.log(err)
  //     })
  //   }
  // }, [exchangeContract])
  function getAllOutBalanceFn () {
    let tokenClass = {}
    for (let tk in allTokens) {
      if (allTokens[tk].extendObj && allTokens[tk].extendObj.BRIDGE) {
        for (let cd of allTokens[tk].extendObj.BRIDGE) {
          if (cd.isSwitch) {
            if (!tokenClass[cd.type]) {
              tokenClass[cd.type] = {}
            }
            tokenClass[cd.type][tk] = allTokens[tk]
          }
        }
      }
    }
    getAllOutBalance(tokenClass, account)
  }
  useEffect(() => {
    if (account) {
      getAllOutBalanceFn()
    }
  }, [account])


  // core swap state
  const [swapState, dispatchSwapState] = useReducer(
    swapStateReducer,
    {
      initialCurrency: initialCurrency,
      inputCurrencyURL: params.inputCurrency,
      outputCurrencyURL: params.outputCurrency,
      exactFieldURL: params.exactField,
      exactAmountURL: params.exactAmount
    },
    getInitialSwapState
  )
  const {
    independentValue,
    dependentValue,
    independentField,
    inputCurrency,
    outputCurrency,
    bridgeType,
    registerAddress,
    PlusGasPricePercentage,
    isDeposit,
    depositMaxNum,
    depositMinNum,
    isRedeem,
    redeemMaxNum,
    redeemMinNum,
    maxFee,
    minFee,
    fee,
    isViewMintModel,
    mintHistory,
    isViewMintInfo,
    realyValue,
    hashArr,
    hashCount,
    withdrawArr,
    withdrawCount,
    redeemBigValMoreTime,
    depositBigValMoreTime
  } = swapState


  const [recipient, setRecipient] = useState({
    address: '',
    name: ''
  })
  const [recipientCount, setRecipientCount] = useState(0)

  useEffect(() => {
    let count = recipientCount + 1
    setRecipientCount(count)
  }, [inputCurrency, bridgeType])


  // get swap type from the currency types
  // const swapType = getSwapType(inputCurrency, outputCurrency)

  const [recipientError, setRecipientError] = useState()

  // get decimals and exchange address for each of the currency types
  const {
    symbol: inputSymbol,
    decimals: inputDecimals,
    name: inputName,
    depositAddress: initDepositAddress,
    isDeposit: initIsDeposit,
    depositMaxNum: initDepositMaxNum,
    depositMinNum: initDepositMinNum,
    isRedeem: initIsRedeem,
    redeemMaxNum: initRedeemMaxNum,
    redeemMinNum: initRedeemMinNum,
    maxFee: initMaxFee,
    minFee: initMinFee,
    fee: initFee,
    extendObj
  } = useTokenDetails( inputCurrency )

  const [isRegister, setIsRegister] = useState(false)
  
  const [isHardwareTip, setIsHardwareTip] = useState(false)
  const [isHardwareError, setIsHardwareError] = useState(false)
  const [hardwareTxnsInfo, setHardwareTxnsInfo] = useState('')
  const [isDisabled, setIsDisableed] = useState(true)
  const [isMintBtn, setIsMintBtn] = useState(false)
  const [isRedeemBtn, setIsRedeem] = useState(false)
  const [mintDtil, setMintDtil] = useState({
    coin: '',
    value: '',
    hash: '',
    from: '',
    to: '',
    status: 0,
    timestamp: ''
  })
  const [mintDtilView, setMintDtilView] = useState(false)
  const [mintSureBtn, setMintSureBtn] = useState(false)
  const [mintModelTitle, setMintModelTitle] = useState()
  const [mintModelTip, setMintModelTip] = useState()
  const [balanceError, setBalanceError] = useState()
  const [bridgeNode, setBridgeNode] = useState()

  function setInit (disabled) {
    setIsRedeem(true)
    setIsMintBtn(true)
    dispatchSwapState({
      type: 'UPDATE_SWAPREGISTER',
      payload: '',
      PlusGasPricePercentage: '',
      isDeposit: disabled,
      depositMaxNum: '',
      depositMinNum: '',
      depositBigValMoreTime: '',
      isRedeem: disabled,
      redeemMaxNum: '',
      redeemMinNum: '',
      maxFee: '',
      minFee: '',
      fee: '',
      redeemBigValMoreTime: '',
      token: ''
    })
  }

  useEffect(() => {
    let node = extendObj.BRIDGE ? extendObj.BRIDGE[0].type : ''
    let version = extendObj.VERSION ? extendObj.VERSION : ''
    let tokenOnlyOne = inputCurrency

    setInit(1)
    // console.log(inputCurrency)
    let coin = formatCoin(inputSymbol)
    if (account && initIsDeposit && initIsRedeem) {
      getServerInfo(account, tokenOnlyOne, inputSymbol, chainId, version).then(res => {
        // console.log(res)
        if (res.msg === 'Success' && res.info) {
          let serverInfo = res.info
          setIsRegister(true)
          try {
            let DepositAddress = ''
            if (!isBTC(coin)) {
              let erc20Token = BridgeTokens[node] && BridgeTokens[node][coin] && BridgeTokens[node][coin].token ? BridgeTokens[node][coin].token : ''
              if (
                (initDepositAddress.toLowerCase() !== serverInfo.depositAddress.toLowerCase())
                || (tokenOnlyOne.toLowerCase() !== serverInfo.token.toLowerCase())
                || (
                    erc20Token && erc20Token.toLowerCase() !== serverInfo.outnetToken.toLowerCase()
                  )
              ) {
                console.log(1)
                // removeRegisterInfo(account, tokenOnlyOne)
                removeLocalConfig(account, tokenOnlyOne, chainId)
                setInit(0)
                return
              }
              DepositAddress = serverInfo.depositAddress
            } else {
              if (serverInfo.dcrmAddress.toLowerCase() !== config.btcConfig.btcAddr.toLowerCase()) {
                console.log(2)
                // removeRegisterInfo(account, tokenOnlyOne)
                removeLocalConfig(account, tokenOnlyOne, chainId)
                setInit(0)
                return
              }
              console.log(serverInfo)
              let p2pAddress = serverInfo.p2pAddress ? serverInfo.p2pAddress : getRegisterInfo(account, tokenOnlyOne, chainId, version, coin).p2pAddress
              if (p2pAddress) {
                DepositAddress = p2pAddress
                console.log('DepositAddress', DepositAddress)
                let localBTCAddr = createBTCaddress(account)
                console.log('localBTCAddr', localBTCAddr)
                if (p2pAddress !== localBTCAddr) {
                  console.log(3)
                  // removeRegisterInfo(account, tokenOnlyOne)
                  removeLocalConfig(account, tokenOnlyOne, chainId)
                  setInit(0)
                  return
                }
              } else {
                console.log(4)
                // removeRegisterInfo(account, tokenOnlyOne)
                // removeLocalConfig(account, tokenOnlyOne, chainId)
                setInit(0)
                return
              }
            }
            let serverObj = {
              type: 'UPDATE_SWAPREGISTER',
              payload: DepositAddress,
              PlusGasPricePercentage: serverInfo.PlusGasPricePercentage,
              isDeposit: serverInfo.isDeposit,
              depositMaxNum: serverInfo.depositMaxNum,
              depositMinNum: serverInfo.depositMinNum,
              depositBigValMoreTime: serverInfo.depositBigValMoreTime,
              isRedeem: serverInfo.isRedeem,
              redeemMaxNum: serverInfo.redeemMaxNum,
              redeemMinNum: serverInfo.redeemMinNum,
              maxFee: serverInfo.maxFee,
              minFee: serverInfo.minFee,
              fee: serverInfo.fee,
              redeemBigValMoreTime: serverInfo.redeemBigValMoreTime,
              token: serverInfo.token,
            }
            dispatchSwapState(serverObj)
          } catch (error) {
            console.log(error)
            setInit('')
            return
          }
        } else {
          setInit('')
          setIsRegister(false)
        }
      })
    } else {
      setInit('')
    }
  }, [inputCurrency, account, initDepositAddress, initIsDeposit, initDepositMaxNum, initDepositMinNum, initIsRedeem, initRedeemMaxNum, initRedeemMinNum, initMaxFee, initMinFee, initFee, inputSymbol])


  const [outNetBalance, setOutNetBalance] = useState()
  const [outNetETHBalance, setOutNetETHBalance] = useState()

  // get balances for each of the currency types
  const inputBalance = useAddressBalance(account, inputCurrency)
  const FSNBalance = useAddressBalance(account, config.symbol)
  const FSNBalanceNum = FSNBalance ? amountFormatter(FSNBalance) : 0

  // useEffect(() => {
  //   setOutNetBalance('')
  //   setOutNetETHBalance('')
  //   getOutBalance()
  // }, [inputCurrency, account, isDeposit, isRedeem])
  function setOutBalance () {
    let node = extendObj.BRIDGE ? extendObj.BRIDGE[0].type : ''
    if (node && account) {
      let lob = getLocalOutBalance(node, account, inputCurrency)
      if (lob && lob.info) {
        let bl = amountFormatter(ethers.utils.bigNumberify(lob.info.balance), inputDecimals, Math.min(8, inputDecimals))
        setOutNetBalance(bl)
      } else {
        setOutNetBalance('')
      }
      let lobBase = getLocalOutBalance(node, account, 'BASE')
      if (lobBase && lobBase.info) {
        let bl = amountFormatter(ethers.utils.bigNumberify(lobBase.info.balance), 18, 8)
        setOutNetETHBalance(bl)
      } else {
        setOutNetETHBalance('')
      }
    }
  }
  useEffect(() => {
    // getOutBalance()
    setOutNetBalance('')
    setOutNetETHBalance('')
    setOutBalance()
    // library.on('block', block => {
    //   // console.log(block)
    //   setOutBalance()
    // })

    // return () => {
    //   library.removeListener('block', setOutBalance)
    // }
  }, [inputCurrency, account, extendObj, inputBalance, hashCount, hashArr, FSNBalance])
// }, [hashCount, hashArr, FSNBalance, inputBalance, withdrawArr, withdrawCount])

  // console.log(FSNBalanceNum)
  // const outputBalance = useAddressBalance(account, outputCurrency)
  const inputBalanceFormatted = !!(inputBalance && Number.isInteger(inputDecimals))
    ? amountFormatter(inputBalance, inputDecimals, inputDecimals)
    : ''

  // declare/get parsed and formatted versions of input/output values
  // const [independentValueParsed, setIndependentValueParsed] = useState()
  const dependentValueFormatted = !!(dependentValue && (inputDecimals || inputDecimals === 0))
    ? amountFormatter(dependentValue, inputDecimals, Math.min(8, inputDecimals), false)
    : ''
  // const inputValueParsed = independentField === INPUT ? independentValueParsed : dependentValue
  let inputValueFormatted = independentField === INPUT ? independentValue : dependentValueFormatted
  // if (inputValueFormatted) {
  //   console.log(independentField === INPUT)
  //   console.log(independentValue)
  //   console.log(inputValueFormatted)
  //   console.log(ethers.utils.parseUnits(inputValueFormatted.toString(), inputDecimals).toString())
  // }
  
  inputValueFormatted = inputValueFormatted ? Number(formatDecimal(inputValueFormatted, inputDecimals)) : ''
  // console.log(independentValue)
  // console.log(inputValueFormatted)
  // console.log(dependentValueFormatted)
  // console.log(amountFormatter(dependentValue, inputDecimals, Math.min(8, inputDecimals), false))
  function formatBalance(value) {
    return `Balance: ${value}`
  }
  const toggleWalletModal = useWalletModalToggle()

  const newInputDetected =
    inputCurrency !== config.symbol && inputCurrency && !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(inputCurrency)

  const [showInputWarning, setShowInputWarning] = useState(false)
  // const [showOutputWarning, setShowOutputWarning] = useState(false)
  // console.log(inputDecimals)
  useEffect(() => {
    if (newInputDetected) {
      setShowInputWarning(true)
    } else {
      setShowInputWarning(false)
    }
  }, [newInputDetected, setShowInputWarning])

  const addTransaction = useTransactionAdder()

  const tokenContract = useSwapTokenContract(inputCurrency, swapBTCABI)
  const tokenETHContract = useSwapTokenContract(inputCurrency, swapETHABI)

  
  useEffect(() => {
    if (bridgeType && bridgeType === 'redeem') {
      if (
        !error
        && isDisabled 
        && isRedeem 
        && !showBetaMessage 
        && inputValueFormatted
        && recipient.address
        && Number(inputBalanceFormatted) >= Number(inputValueFormatted)
        && Number(inputValueFormatted) <= Number(redeemMaxNum)
        && Number(inputValueFormatted) >= Number(redeemMinNum)
      ) {
        if (isBTC(inputSymbol) && isBTCAddress(recipient.address)) {
          setIsRedeem(false)
          setBalanceError('')
        } else if (!isBTC(inputSymbol) && isAddress(recipient.address)) {
          setIsRedeem(false)
          setBalanceError('')
        } else {
          setIsRedeem(true)
          if (inputValueFormatted === ''
            || (
              Number(inputBalanceFormatted) >= Number(inputValueFormatted)
              && Number(inputValueFormatted) <= Number(redeemMaxNum)
              && Number(inputValueFormatted) >= Number(redeemMinNum)
            )
          ) {
            setBalanceError('')
          } else {
            setBalanceError('Error')
          }
        }
      } else {
        setIsRedeem(true)
        if (inputValueFormatted === ''
          || (
            Number(inputBalanceFormatted) >= Number(inputValueFormatted)
            && Number(inputValueFormatted) <= Number(redeemMaxNum)
            && Number(inputValueFormatted) >= Number(redeemMinNum)
          )
        ) {
          setBalanceError('')
        } else {
          setBalanceError('Error')
        }
      }
    } else {
      if (
        isDisabled 
        && isDeposit 
        && !showBetaMessage 
        && inputValueFormatted
        && registerAddress
        && isRegister
        && Number(inputValueFormatted) <= depositMaxNum
        && Number(inputValueFormatted) >= depositMinNum
      ) {
        if ( isBTC(inputSymbol) ) {
          setIsMintBtn(false)
          setBalanceError('')
        } else if (
          !isBTC(inputSymbol)
          && Number(inputValueFormatted) <= Number(outNetBalance)
          && Number(outNetETHBalance) >= 0.01
        ) {
          setIsMintBtn(false)
          setBalanceError('')
        } else {
          setIsMintBtn(true)
          if (inputValueFormatted === '' || ( Number(inputValueFormatted) <= depositMaxNum && Number(inputValueFormatted) >= depositMinNum ) ) {
            setBalanceError('')
          } else {
            setBalanceError('Error')
          }
        }
      } else {
        setIsMintBtn(true)
        if (inputValueFormatted === '' || ( Number(inputValueFormatted) <= depositMaxNum && Number(inputValueFormatted) >= depositMinNum ) ) {
          setBalanceError('')
        } else {
          setBalanceError('Error')
        }
      }
    }
  }, [account, isDisabled, isRedeem, showBetaMessage, recipient.address, independentValue, inputSymbol, isDeposit, registerAddress, outNetBalance, bridgeType, depositMaxNum, depositMinNum])
  
  function cleanInput () {
    dispatchSwapState({
      type: 'UPDATE_INDEPENDENT',
      payload: {
        value: '',
        field: INPUT,
        realyValue: ''
      }
    })
  }
  function sendTxnsEnd (data, value, address, node) {
    addTransaction(data)
    recordTxns(data, 'WITHDRAW', inputSymbol, account, address, node)
    dispatchSwapState({
      type: 'UPDATE_WITHDRAW_STATUS',
      payload: {
        type: 0,
        withdrawData: {
          account: account,
          coin: inputSymbol,
          value: amountFormatter(value, inputDecimals, inputDecimals),
          hash: data.hash,
          from: account,
          to: address,
          status: 0,
          timestamp: Date.now(),
          swapHash: '',
          swapStatus: 'pending',
          swapTime: '',
          node: node,
          bridgeVersion: extendObj.VERSION ? extendObj.VERSION : 'V1',
          chainID: config.chainID,
          bindAddr: registerAddress
        }
      }
    })
    cleanInput()
  }
  function sendTxns (node) {
    if (isBTC(inputSymbol) && !isBTCAddress(recipient.address)) {
      alert('Illegal address!')
      return
    }
    if (!isDisabled) return
    setIsDisableed(false)
    setTimeout(() => {
      setIsDisableed(true)
    }, 3000)
    
    let amountVal = ethers.utils.parseUnits(inputValueFormatted.toString(), inputDecimals)
    if (amountVal.gt(inputBalance)) {
      amountVal = inputBalance
    }
    let address = recipient.address
    if (config.supportWallet.includes(walletType)) {
      setIsHardwareError(false)
      setIsHardwareTip(true)
      setHardwareTxnsInfo(amountFormatter(amountVal, inputDecimals, inputDecimals) + " "  + inputSymbol)
      let web3Contract = getWeb3ConTract(swapBTCABI, inputCurrency)

      let data = web3Contract.methods.Swapout(amountVal, address).encodeABI()
      if (!isBTC(inputSymbol)) {
        web3Contract = getWeb3ConTract(swapETHABI, inputCurrency)
        // data = web3Contract.Swapout.getData(amountVal)
        data = web3Contract.methods.Swapout(amountVal, address).encodeABI()
      }
      getWeb3BaseInfo(inputCurrency, inputCurrency, data, account).then(res => {
        if (res.msg === 'Success') {
          // console.log(res.info)
          sendTxnsEnd(res.info, amountVal, address, node)
        } else {
          alert(res.error)
        }
        setIsHardwareTip(false)
      })
      return
    }

    if (!isBTC(inputSymbol)) {
      // console.log(amountVal)
      tokenETHContract.Swapout(amountVal, address).then(res => {
        // console.log(res)
        // addTransaction(res)
        // cleanInput()
        sendTxnsEnd(res, amountVal, address, node)
        setIsHardwareTip(false)
      }).catch(err => {
        console.log(err)
        setIsHardwareTip(false)
      })
    } else {
      tokenContract.Swapout(amountVal, address).then(res => {
        sendTxnsEnd(res, amountVal, address, node)
        setIsHardwareTip(false)
      }).catch(err => {
        console.log(err)
        setIsHardwareTip(false)
      })
    }
  }
  function MintModelView () {
    if (!registerAddress) return
    if (isViewMintModel) {
      setMintBTCErrorTip('')
    }
    dispatchSwapState({
      type: 'UPDATE_MINTTYPE',
      payload: isViewMintModel ? false : true
    })
  }
  function MintInfoModelView () {
    dispatchSwapState({
      type: 'UPDATE_MINTINFOTYPE',
      payload: isViewMintInfo ? false : true
    })
  }
  function changeMorR () {
    let bt = ''
    if (bridgeType && bridgeType === 'redeem') {
      bt = 'mint'
    } else {
      bt = 'redeem'
    }
    dispatchSwapState({ type: 'UPDATE_BREDGETYPE', payload: bt })
    cleanInput()
  }

  function insertMintHistory (coin, value, hash, from, to, node) {
    let data = {
      account: account,
      coin: coin,
      value: value,
      hash: hash,
      from: from,
      to: to,
      status: 0,
      timestamp: Date.now(),
      swapHash: '',
      swapStatus: '',
      swapTime: '',
      node: node,
      bridgeVersion: extendObj.VERSION ? extendObj.VERSION : 'V1',
      chainID: config.chainID
    }
    console.log(data)
    dispatchSwapState({
      type: 'UPDATE_HASH_STATUS',
      payload: {
        type: 0,
        hashData: data
      }
    })
  }
  
  function mintAmount (mintAddress, mintCoin) {
    let coin = formatCoin(mintCoin)

    if (initDepositAddress.toLowerCase() !== mintAddress.toLowerCase()) {
      alert('Data error, please refresh and try again!')
      setIsHardwareTip(false)
      setMintSureBtn(false)
      setMintModelTitle('')
      setMintModelTip('')
      return
    }
    
    if (walletType === 'Ledger') {
      setHardwareTxnsInfo(inputValueFormatted + ' ' + coin)
      setIsHardwareTip(true)
      setMintSureBtn(false)
      // MintModelView()
      HDsendERC20Txns(coin, account, mintAddress, inputValueFormatted, PlusGasPricePercentage, bridgeNode, inputCurrency).then(res => {
        // console.log(res)
        if (res.msg === 'Success') {
          recordTxns(res.info, 'DEPOSIT', inputSymbol, account, mintAddress, bridgeNode)
          insertMintHistory(coin, inputValueFormatted, res.info.hash, account, mintAddress, bridgeNode)
          cleanInput()
          setIsHardwareTip(false)
          setMintModelTitle('')
          setMintModelTip('')
          setMintSureBtn(false)
        } else {
          setIsHardwareError(true)
          alert(res.error.toString())
        }
      })
    } else {
      setMintSureBtn(false)
      MMsendERC20Txns(coin, account, mintAddress, inputValueFormatted, PlusGasPricePercentage, bridgeNode, inputCurrency).then(res => {
        // console.log(res)
        if (res.msg === 'Success') {
          console.log(bridgeNode)
          recordTxns(res.info, 'DEPOSIT', inputSymbol, account, mintAddress, bridgeNode)
          insertMintHistory(coin, inputValueFormatted, res.info.hash, account, mintAddress, bridgeNode)
          cleanInput()
        } else {
          console.log(res.error)
          alert(res.error.toString())
        }
        setIsHardwareTip(false)
        setMintSureBtn(false)
        setMintModelTitle('')
        setMintModelTip('')
      })
    }
  }
  function removeHashArr () {
    dispatchSwapState({
      type: 'UPDATE_HASH_STATUS',
      payload: {
        type: 1,
        hashData: []
      }
    })
  }
  const [removeHashStatus, setRemoveHashStatus] = useState()
  function removeHash (index) {
    let arr = []
    if (bridgeType === 'redeem') {
      for (let i = 0, len = withdrawArr.length; i < len; i++) {
        if (index === i) continue
        arr.push(withdrawArr[i])
      }
      dispatchSwapState({
        type: 'UPDATE_WITHDRAW_STATUS',
        payload: {
          type: 1,
          withdrawData: arr,
        }
      })
    } else {
      for (let i = 0, len = hashArr.length; i < len; i++) {
        if (index === i) continue
        arr.push(hashArr[i])
      }
      dispatchSwapState({
        type: 'UPDATE_HASH_STATUS',
        payload: {
          type: 1,
          hashData: arr,
        }
      })
    }
    setRemoveHashStatus(Date.now())
  }

  function updateHashStatusData (res) {
    if (hashArr[res.index] && res.hash === hashArr[res.index].hash) {
      hashArr[res.index].status = res.status
      hashArr[res.index].swapHash = res.swapHash ? res.swapHash : ''
      hashArr[res.index].swapStatus = res.swapStatus ? res.swapStatus : ''
      hashArr[res.index].swapTime = res.swapTime ? res.swapTime : ''
      dispatchSwapState({
        type: 'UPDATE_HASH_STATUS',
        payload: {
          type: 1,
          hashData: hashArr,
          NewHashCount: 1
        }
      })
    }
  }
  function updateHashStatus () {
    if (hashArr.length > 0) {
      for (let i = 0, len = hashArr.length; i < len; i ++) {
        if (hashArr[i].chainID && hashArr[i].chainID !== config.chainID) continue
        if (
          !hashArr[i].status
          || !hashArr[i].swapStatus
          || hashArr[i].swapStatus === 'pending'
          || hashArr[i].swapStatus === 'confirming'
          || hashArr[i].swapStatus === 'minting'
        ) {
          if (isBTC(hashArr[i].coin)) {
            GetBTChashStatus(hashArr[i].hash, i, hashArr[i].coin, hashArr[i].status, hashArr[i].account, hashArr[i].bridgeVersion).then(res => {
              updateHashStatusData(res)
            })
          } else {
            getHashStatus(hashArr[i].hash, i, hashArr[i].coin, hashArr[i].status, hashArr[i].node, hashArr[i].account, hashArr[i].bridgeVersion).then(res => {
              updateHashStatusData(res)
            })
          }
        }
      }
    }
  }

  function updateWithdrawStatus () {
    if (withdrawArr.length > 0) {
      for (let i = 0, len = withdrawArr.length; i < len; i ++) {
        if (withdrawArr[i].chainID && withdrawArr[i].chainID !== config.chainID) continue
        if (
          !withdrawArr[i].status
          || !withdrawArr[i].swapStatus
          || withdrawArr[i].swapStatus === 'pending'
          || withdrawArr[i].swapStatus === 'confirming'
          || withdrawArr[i].swapStatus === 'minting'
        ) {
          let binAddr = isBTC(withdrawArr[i].coin) ? withdrawArr[i].bindAddr : withdrawArr[i].account
          getWithdrawHashStatus(withdrawArr[i].hash, i, withdrawArr[i].coin, withdrawArr[i].status, withdrawArr[i].node, binAddr, withdrawArr[i].bridgeVersion).then(res => {
            // console.log(res)
            if (withdrawArr[res.index] && res.hash === withdrawArr[res.index].hash) {
              withdrawArr[res.index].status = res.status ? res.status : 0
              withdrawArr[res.index].swapHash = res.swapHash ? res.swapHash : ''
              withdrawArr[res.index].swapStatus = res.swapStatus ? res.swapStatus : 'pending'
              withdrawArr[res.index].swapTime = res.swapTime ? res.swapTime : ''
              dispatchSwapState({
                type: 'UPDATE_WITHDRAW_STATUS',
                payload: {
                  type: 1,
                  withdrawData: withdrawArr,
                  withdrawCount: 1
                }
              })
            }
          })
        }
      }
    }
  }

  useEffect(() => {
    if (!account) return
    clearInterval(hashInterval)
    updateHashStatus()
    updateWithdrawStatus()
    hashInterval = setInterval(() => {
      if (location.pathname.indexOf('bridge') !== -1) {
        updateHashStatus()
        updateWithdrawStatus()
      } else {
        clearInterval(hashInterval)
      }
    }, 1000 * 50)
  }, [removeHashStatus, account])
  const [mintBTCErrorTip, setMintBTCErrorTip] = useState()
  const [loadingState, setLoadingState] = useState(false)
  function getBTCtxns () {
    setLoadingState(true)
    GetBTCtxnsAll(registerAddress, account, formatCoin(inputSymbol), (extendObj.VERSION ? extendObj.VERSION : 'V1')).then(res => {
      // console.log(res)
      if (res) {
        for (let obj of hashArr) {
          if (res.hash === obj.hash) {
            setMintBTCErrorTip(t('BTCmintTip'))
            MintModelView()
            return
          }
        }
        insertMintHistory(res.coin, res.value, res.hash, account, res.to, 0)
        cleanInput()
        setMintDtil(res)
        setMintDtilView(true)
      } else {
        setMintBTCErrorTip(t('BTCmintTip'))
        MintModelView()
      }
      setLoadingState(false)
    })
  }

  function walletTip () {
    let node = extendObj.BRIDGE ? extendObj.BRIDGE[0] : ''
    if (node) {
      let coin = config.bridgeAll[node.type].symbol
      return (
        <dd><i></i>💀 {t('bridgeMintTip', {
          account,
          coin: coin
        })}</dd>
      )
    }
  }

  function txnsList (arr, count) {
    // console.log(arr)
    return (
      <MintHahshList key={count}>
        <ul>
          {arr.map((item, index) => {
            if (item.account !== account) {
              return ''
            }
            return (
              <li key={count ? index + count : index}>
                <FlexCneter>
                  <TokenLogoBox address={item.coin} size={'2rem'}  onClick={() => {
                    setMintDtil(item)
                    setMintDtilView(true)
                  }}/>
                  <div
                    className='del'
                    onClick={() => {
                      removeHash(index)
                    }}
                  >x</div>
                </FlexCneter>
              </li>
            )
          })}
        </ul>
        {/* {
          hashArr.length > 0 ? (
            <div onClick={() => {
              removeHashArr()
            }} className='delete'>x</div>
          ) : ''
        } */}
      </MintHahshList>
    )
  }

  function txnsListDtil () {
    if (!mintDtil || !mintDtil.hash) return ''
    console.log(mintDtil)
    let hashCurObj = {}
    let hashOutObj = {}
    if (bridgeType === 'redeem') {
      hashCurObj = {
        hash: mintDtil.hash,
        url: config.bridgeAll[chainId].lookHash + mintDtil.hash
      }
      if (isBTC(mintDtil.coin)) {
        hashOutObj = {
          hash: mintDtil.swapHash,
          url: config.btcConfig.lookHash + mintDtil.swapHash
        }
      } else {
        hashOutObj = {
          hash: mintDtil.swapHash,
          url: config.bridgeAll[mintDtil.node].lookHash + mintDtil.swapHash
        }
      }
    } else {
      hashOutObj = {
        hash: mintDtil.swapHash,
        url: config.bridgeAll[chainId].lookHash + mintDtil.swapHash
      }
      if (isBTC(mintDtil.coin)) {
        hashCurObj = {
          hash: mintDtil.hash,
          url: config.btcConfig.lookHash + mintDtil.hash
        }
      } else {
        hashCurObj = {
          hash: mintDtil.hash,
          url: config.bridgeAll[mintDtil.node].lookHash + mintDtil.hash
        }
      }
    }
    // console.log(hashOutObj)
    let outNodeName = '', curNodeName = config.bridgeAll[chainId].name
    if (!mintDtil.node) {
      outNodeName = 'Bitcoin'
    } else {
      outNodeName = config.bridgeAll[mintDtil.node].name
    }
    let curHash = (
      <MintListVal>
        <a href={hashCurObj.url} target="_blank" className='link'>{hashCurObj.hash}</a>
        <Copy toCopy={hashCurObj.hash} />
      </MintListVal>
    )
    let outHash = (
      <MintListVal>
        <a href={hashOutObj.url} target="_blank" className='link'>{hashOutObj.hash}</a>
        <Copy toCopy={hashOutObj.hash} />
      </MintListVal>
    )
    let outStatus = (
      <HashStatus className={
        !mintDtil.status ? 'yellow' : (mintDtil.status === 1 ? 'green' : 'red')
      }>
        <div>
          <img src={ScheduleIcon} alt='' style={{marginRight: '10px'}}/>
          {outNodeName + ' ' + t('txnsStatus')}
        </div>
        {!mintDtil.status ? (<span className='green'>{bridgeType === 'redeem' ? 'Redeeming' : 'Pending'}</span>) : ''}
        {mintDtil.status === 1 ? (<span className='green'>Success</span>) : ''}
        {mintDtil.status === 2 ? (<span className='red'>Failure</span>) : ''}
      </HashStatus>
    )
    return (
      <MintDiv>
        <MintList>
          <MintListLabel>{(bridgeType === 'redeem' ? curNodeName : outNodeName) + ' ' + t('hash')}:</MintListLabel>
          {curHash}
        </MintList>
        {
          hashOutObj.hash ? (
            <MintList>
              <MintListLabel>{(bridgeType === 'redeem' ? outNodeName : curNodeName) + ' ' + t('hash')}:</MintListLabel>
              {outHash}
            </MintList>
          ) : ''
        }
        {
          mintDtil.from ? (
            <MintList>
              <MintListLabel>{t('from')}:</MintListLabel>
              <MintListVal>
                {mintDtil.from}
                <Copy toCopy={mintDtil.from} />
              </MintListVal>
            </MintList>
          ) : ''
        }
        <MintList>
          <MintListLabel>{t('to')}:</MintListLabel>
          <MintListVal>
            {mintDtil.to}
            <Copy toCopy={mintDtil.to} />
          </MintListVal>
        </MintList>
        <MintList>
          <MintListLabel>{t('value')}:</MintListLabel>
          <MintListVal>{Number(mintDtil.value)}</MintListVal>
        </MintList>
        <FlexCneter>
          <TokenLogoBox1>
            <TokenLogo address={mintDtil.coin} size={'26px'} ></TokenLogo>
          </TokenLogoBox1>
        </FlexCneter>
        <FlexCneter>
          <DepositValue>
            <p>{bridgeType === 'redeem' ? t('ValueWithdraw') : t('ValueDeposited')}</p>
            <span>{Number(mintDtil.value)} {mintDtil.coin}</span>
          </DepositValue>
        </FlexCneter>
        {
          bridgeType && bridgeType === 'redeem' ? '' : outStatus
        }
        {
          mintDtil.swapStatus ? (
            <HashStatus className={
              mintDtil.swapStatus === 'confirming' || mintDtil.swapStatus === 'minting' ? 'yellow' : (mintDtil.swapStatus === 'failure' || mintDtil.swapStatus === 'timeout' ? 'red' : 'green')
            }>
              <div>
                <img src={ScheduleIcon} alt='' style={{marginRight: '10px'}}/>
                {curNodeName + ' ' + t('txnsStatus')}
              </div>
              <span style={{textTransform: 'Capitalize'}}>{mintDtil.swapStatus}</span>
            </HashStatus>
          ) : ''
        }
        {
          bridgeType && bridgeType === 'redeem' && mintDtil.swapStatus === 'success' ? outStatus : ''
        }
      </MintDiv>
    )
  }

  function redeemBtn (type, index) {
    return (
      <>
        <Button
          disabled={ isRedeemBtn }
          key={index}
          onClick={() => {
            sendTxns(type)
          }}
          warning={Number(inputBalanceFormatted) < Number(inputValueFormatted)}
          loggedOut={!account}
        >
          <StyledBirdgeIcon>
            <img src={BirdgeIcon} alt={''} />
            {t('redeem')}
          </StyledBirdgeIcon>
        </Button>
      </>
    )
  }
  function mintBtn (type, index) {
    return (
      <>
        <Button
          disabled={isMintBtn}
          key={index}
          onClick={() => {
            // MintModelView()
            if (!isDisabled) return
            setIsDisableed(false)
            setTimeout(() => {
              setIsDisableed(true)
            }, 3000)
            if ( isBTC(inputSymbol) ) {
              // MintModelView()
              getBTCtxns()
            } else {
              setBridgeNode(type)
              setMintSureBtn(true)
              setHardwareTxnsInfo(inputValueFormatted + ' ' + formatCoin(inputSymbol))
              setIsHardwareTip(true)
              setMintModelTitle(t('CrossChainDeposit'))
              if (walletType === 'Ledger') {
                setMintModelTip(t("confirmHardware"))
              } else {
                setMintModelTip(t('mmMintTip'))
              }
            }
          }}
          warning={account && (!inputValueFormatted || Number(inputValueFormatted) > depositMaxNum || Number(inputValueFormatted) < depositMinNum)}
          loggedOut={!account}
        >
          <StyledBirdgeIcon>
            <img src={BirdgeBtnIcon} alt={''} />
            {t('CrossChainDeposit')}
          </StyledBirdgeIcon>
        </Button>
      </>
    )
  }
  function viewBtn (type) {
    let btn = ''
    if (type === 'redeem') {
      if (extendObj.BRIDGE) {
        btn = extendObj.BRIDGE.map((item, index) => {
          if (item.isSwitch) {
            return (
              <AutoDiv key={index}>
                {redeemBtn(item.type, index)}
              </AutoDiv>
            )
          } else {
            return ''
          }
        })
      } else {
        btn = redeemBtn('')
      }
    } else {
      if (loadingState) {
        btn = (
          <Button disabled={true} >
            <SpinnerWrapper src={Circle}/>
            {t('querying')}
          </Button>
        )
      } else {
        if (extendObj.BRIDGE) {
          btn = extendObj.BRIDGE.map((item, index) => {
            if (item.isSwitch) {
              // return mintBtn(item.type, index)
              return (
                <AutoDiv key={index}>
                  {mintBtn(item.type, index)}
                </AutoDiv>
              )
            } else {
              return ''
            }
          })
        } else {
          btn = mintBtn('')
        }
      }
    }
    return btn
  }

  function noBalanceTip () {
    let node = extendObj.BRIDGE && extendObj.BRIDGE[0] && extendObj.BRIDGE[0].type ? extendObj.BRIDGE[0].type : ''
    if (
      (bridgeType && bridgeType === 'redeem')
      || !account
      || !registerAddress
      || isBTC(inputSymbol)
      || (Number(outNetETHBalance) >= 0.02 && Number(outNetBalance) > Number(depositMinNum))
      || !node
    ) {
      return ''
    } else {
      let coin = formatCoin(inputSymbol)
      if (node === 1 || node === 4) {
        if (coin !== 'ETH') {
          coin = coin + '-ERC20'
        }
      }
      return (
        <MintWarningTip>
          <img src={WarningIcon} alt='' style={{marginRight: '8px'}}/>
          <span dangerouslySetInnerHTML = { 
            {__html: t('mintTip0', { 
              coin: coin,
              coin2: config.bridgeAll[node].symbol
            })}
          }></span>
          <span className='span' >{account}</span><Copy toCopy={account} />
        </MintWarningTip>
      )
    }
  }

  // console.log(hashArr)
  return (
    <>
      <HardwareTip
        HardwareTipOpen={isHardwareTip}
        closeHardwareTip={() => {
          setIsHardwareTip(false)
          setIsHardwareError(false)
        }}
        error={isHardwareError}
        txnsInfo={hardwareTxnsInfo}
        isSelfBtn={mintSureBtn}
        onSure={() => {
          mintAmount(registerAddress, inputSymbol)
        }}
        title={mintModelTitle}
        tipInfo={mintModelTip}
        coin={inputSymbol}
      >

      </HardwareTip>
      {showInputWarning && (
        <WarningCard
          onDismiss={() => {
            setShowInputWarning(false)
          }}
          urlAddedTokens={urlAddedTokens}
          currency={inputCurrency}
        />
      )}
      <Modal isOpen={isViewMintModel} maxHeight={800}>
        <Wrapper>
          <UpperSection>
            <CloseIcon onClick={() =>  {
              MintModelView()
            }}>
              <CloseColor alt={'close icon'} />
            </CloseIcon>
            <HeaderRow>
              <HoverText>{t('deposit1')}</HoverText>
            </HeaderRow>
            <ContentWrapper>
              <MintDiv>
                
                {inputValueFormatted ? (
                  <>
                    <MintList>
                      <MintListLabel>{t('deposit1')} {inputSymbol && formatCoin(inputSymbol)} {t('amount')}:</MintListLabel>
                      <MintListVal>{inputValueFormatted}</MintListVal>
                    </MintList>
                  </>
                ) : ''}
                <MintList>
                  <MintListLabel>{t('deposit1')} {inputSymbol && formatCoin(inputSymbol)} {t('address')}:</MintListLabel>
                  <MintListVal>{registerAddress ? registerAddress : ''}<Copy toCopy={registerAddress} /></MintListVal>
                </MintList>
                <MintListCenter>
                  <WalletConnectData size={160} uri={registerAddress} />
                </MintListCenter>
                {
                  mintBTCErrorTip ? (
                    <>
                      <MintWarningTip>
                        <img src={WarningIcon} alt='' style={{marginRight: '8px'}}/>
                        {mintBTCErrorTip}
                      </MintWarningTip>
                    </>
                  ) : ''
                }
              </MintDiv>
            </ContentWrapper>
          </UpperSection>
        </Wrapper>
      </Modal>

      <Modal isOpen={isViewMintInfo} maxHeight={800}>
        <MintDiv>
          <MintList>
            <MintListLabel>{t('hash')}:</MintListLabel>
            <MintListVal>{mintHistory && mintHistory.mintHash ? mintHistory.mintHash : ''}</MintListVal>
          </MintList>
          <MintList>
            <MintListLabel>{t('from')}:</MintListLabel>
            <MintListVal>{mintHistory && mintHistory.from ? mintHistory.from : ''}</MintListVal>
          </MintList>
          <MintList>
            <MintListLabel>{t('to')}:</MintListLabel>
            <MintListVal>{registerAddress ? registerAddress : ''}</MintListVal>
          </MintList>
          <MintList>
            <MintListLabel>{t('value')}:</MintListLabel>
            <MintListVal>{mintHistory && mintHistory.mintValue ? mintHistory.mintValue : ''}</MintListVal>
          </MintList>
          <MintList>
            <MintListLabel>{t('fee')}:</MintListLabel>
            <MintListVal>{mintHistory && mintHistory.mintValue && (fee || fee === 0) ? Number(mintHistory.mintValue) * Number(fee) : 0}</MintListVal>
          </MintList>
          <MintList>
            <MintListLabel>{t('receive')}:</MintListLabel>
            <MintListVal>{mintHistory && mintHistory.mintValue && (fee || fee === 0) ? Number(mintHistory.mintValue) * (1 - Number(fee)) : ''}</MintListVal>
          </MintList>
          <MintList>
            <MintListLabel>{t('receive')} {config.symbol} {t('address')}:</MintListLabel>
            <MintListVal>{account}</MintListVal>
          </MintList>
          <FlexCneter style={{marginTop: '30px'}}>
            <Button onClick={MintInfoModelView} >{t('close')}</Button>
          </FlexCneter>
        </MintDiv>
      </Modal>

      <Modal isOpen={mintDtilView} maxHeight={800}>
        <Wrapper>
          <UpperSection>
            <CloseIcon onClick={() =>  {
              setMintDtilView(false)
            }}>
              <CloseColor alt={'close icon'} />
            </CloseIcon>
            <HeaderRow>
              <HoverText>{
                t('txnsDtil')
              }</HoverText>
            </HeaderRow>
            <ContentWrapper>
              {mintDtil ? txnsListDtil() : ''}
            </ContentWrapper>
          </UpperSection>
        </Wrapper>
        
      </Modal>

      { (mintHistory && mintHistory.mintTip) ?  
          (
            <>
              <MintTip onClick={MintInfoModelView}>
                <FlexCneter>
                  <FlexCneter><TokenLogoBox size={'34px'} address={inputSymbol ? 'BTC' : formatCoin(inputSymbol)} /></FlexCneter>
                  <span className="txt"><FlexCneter>Waiting for deposit</FlexCneter></span>
                </FlexCneter>
              </MintTip>
            </>
          )
          :
          ''
      }
      {bridgeType && bridgeType === 'redeem' ? txnsList(withdrawArr, withdrawCount) : txnsList(hashArr, hashCount)}

      <NavTabBox>
        <TitleBoxPool>{t('bridge')}</TitleBoxPool>
        <TabLinkBox>
          <li
              className={bridgeType && bridgeType === 'redeem' ? '' : 'active'}
              onClick={changeMorR}
            > 
            <div className='icon'>
              {
                bridgeType && bridgeType === 'redeem' ? (
                  <img alt={''} src={DepositIcon}/>
                ) : (
                  <img alt={''} src={DepositActiveIcon}/>
                )
              }
            </div>
            {t('deposit1')}
          </li>
          <li
              className={bridgeType && bridgeType === 'redeem' ? 'active' : ''}
              onClick={changeMorR}
            > 
            <div className='icon'>
              {
                bridgeType && bridgeType === 'redeem' ? (
                  <img alt={''} src={WithdrawActiveIcon}/>
                ) : (
                  <img alt={''} src={WithdrawIcon}/>
                )
              }
            </div>
            {t('redeem')}
          </li>
        </TabLinkBox>
      </NavTabBox>
      <CurrencyInputPanel
        // title={t('input')}
        title={t(bridgeType && bridgeType === 'redeem' ? 'redeem' : 'deposit1')}
        urlAddedTokens={urlAddedTokens}
        extraText={bridgeType && bridgeType === 'redeem' && inputBalanceFormatted ? formatBalance(inputBalanceFormatted) : (outNetBalance && !isBTC(inputSymbol) ? formatBalance(outNetBalance) : '')}
        extraTextClickHander={() => {
          let inputVal
          let value = ''
          if (bridgeType && bridgeType === 'redeem' && inputBalance && inputDecimals) {
            inputVal = inputBalance
            if (inputVal.gt(ethers.constants.Zero)) {
              let _redeemMinNum = ethers.utils.parseUnits(redeemMinNum.toString(), inputDecimals)
              let _redeemMaxNum = ethers.utils.parseUnits(redeemMaxNum.toString(), inputDecimals)
              if (inputVal.lt(_redeemMinNum)) {
                inputVal = ''
              } else if (inputVal.gt(_redeemMaxNum)) {
                inputVal = _redeemMaxNum
              }
              if (inputVal) {
                value = amountFormatter(inputVal, inputDecimals, Math.min(8, inputDecimals))
                let _fee = inputVal.mul(ethers.utils.parseUnits(fee.toString(), 18)).div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))
                let _minFee = ethers.utils.parseUnits(minFee.toString(), inputDecimals)
                let _maxFee = ethers.utils.parseUnits(maxFee.toString(), inputDecimals)

                if (_fee.isZero()) {
                  inputVal = ''
                } else {
                  if (_fee.lt(_minFee)) {
                    _fee = _minFee
                  } else if (_fee.gt(_maxFee)) {
                    _fee = _maxFee
                  }
                  inputVal = inputVal.sub(_fee)
                }
              }
            }
          } else if (bridgeType && bridgeType !== 'redeem' && outNetBalance && inputDecimals) {
            inputVal = ethers.utils.parseUnits(outNetBalance.toString(), inputDecimals)
            let _depositMinNum = ethers.utils.parseUnits(depositMinNum.toString(), inputDecimals)
            let _depositMaxNum = ethers.utils.parseUnits(depositMaxNum.toString(), inputDecimals)
            value = amountFormatter(inputVal, inputDecimals, Math.min(8, inputDecimals))
            if (inputVal.lt(_depositMinNum)) {
              inputVal = ''
            } else if (inputVal.gt(_depositMaxNum)) {
              inputVal = _depositMaxNum
            }
          }

          if (inputVal) {
            inputVal = amountFormatter(inputVal, inputDecimals, Math.min(8, inputDecimals))
          } else {
            inputVal = ''
          }
          console.log(inputVal)
          dispatchSwapState({
            type: 'UPDATE_INDEPENDENT',
            payload: {
              value: value,
              field: INPUT,
              realyValue: inputVal && Number(inputVal) > 0 ? Number(inputVal) : ''
            }
          })
        }}
        onCurrencySelected={inputCurrency => {
          dispatchSwapState({
            type: 'SELECT_CURRENCY',
            payload: { currency: inputCurrency, field: INPUT }
          })
        }}
        onValueChange={inputValue => {
          console.log(inputValue)
          inputValue = formatDecimal(inputValue, inputDecimals)
          let inputVal = inputValue && Number(inputValue) ? ethers.utils.parseUnits(inputValue.toString(), inputDecimals) : ethers.utils.bigNumberify(0)
          if (bridgeType && bridgeType === 'redeem') {
            let _fee = inputVal.mul(ethers.utils.parseUnits(fee.toString(), 18)).div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))
            let _minFee = ethers.utils.parseUnits(minFee.toString(), inputDecimals)
            let _maxFee = ethers.utils.parseUnits(maxFee.toString(), inputDecimals)

            if (_fee.isZero()) {
              inputVal = ''
            } else {
              if (_fee.lt(_minFee)) {
                _fee = _minFee
              } else if (_fee.gt(_maxFee)) {
                _fee = _maxFee
              }
              inputVal = inputVal.sub(_fee)
            }
          }
          if (inputVal) {
            // console.log(inputVal)
            inputVal = amountFormatter(inputVal, inputDecimals, Math.min(10, inputDecimals))
            // console.log(inputVal)
            // inputVal = Number(inputVal.toString().toFixed(8))
            // console.log(inputVal)
          } else {
            inputVal = ''
          }
          dispatchSwapState({
            type: 'UPDATE_INDEPENDENT',
            payload: {
              value: inputValue,
              field: INPUT,
              // realyValue: bridgeType && bridgeType === 'redeem' ? inputVal : inputValue
              realyValue: inputVal ? Number(Number(inputVal).toFixed(8)) : ''
            }
          })
        }}
        isSelfSymbol={bridgeType && bridgeType === 'redeem' && inputSymbol ? inputSymbol : (inputSymbol && formatCoin(inputSymbol))}
        isSelfLogo={bridgeType && bridgeType === 'redeem' && inputSymbol ? '' : (inputSymbol && formatCoin(inputSymbol))}
        isSelfName={bridgeType && bridgeType === 'redeem' && inputName ? '' : inputName.replace(config.symbol === 'BNB' ? config.suffix : config.namePrefix, '')}
        showUnlock={false}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={inputCurrency}
        value={inputValueFormatted}
        hideETH={true}
        selfUseAllToken={selfUseAllToken}
        errorMessage={balanceError}
      />
      { noBalanceTip() }
      {
        bridgeType && bridgeType === 'redeem' && Number(FSNBalanceNum) < 0.001 && account ? (
          <MintWarningTip>
            <img src={WarningIcon} alt='' style={{marginRight: '8px'}}/>
            <span dangerouslySetInnerHTML = { 
              {__html: t('FSNnoBalance')}
            }></span>
          </MintWarningTip>
        ) : ('')
      }
      <OversizedPanel>
        <DownArrowBackground  onClick={changeMorR}>
          <img src={ResertSvg} alt={''} />
        </DownArrowBackground>
      </OversizedPanel>
      <CurrencyInputPanel
        // title={t('input')}
        title={t(bridgeType && bridgeType === 'redeem' ? 'receive' : 'receive')}
        urlAddedTokens={urlAddedTokens}
        extraText={bridgeType && bridgeType === 'redeem' && inputBalanceFormatted ? (outNetBalance && !isBTC(inputSymbol) ? formatBalance(outNetBalance) : '') : inputBalanceFormatted && formatBalance(inputBalanceFormatted)}
        onCurrencySelected={inputCurrency => {
          dispatchSwapState({
            type: 'SELECT_CURRENCY',
            payload: { currency: inputCurrency, field: INPUT }
          })
        }}
        isSelfSymbol={bridgeType && bridgeType === 'redeem' && inputSymbol ? formatCoin(inputSymbol) : inputSymbol}
        isSelfLogo={bridgeType && bridgeType === 'redeem' && inputSymbol ? formatCoin(inputSymbol) : ''}
        isSelfName={bridgeType && bridgeType === 'redeem' && inputName ? inputName.replace(config.symbol === 'BNB' ? config.suffix : config.namePrefix, '') : ''}
        showUnlock={false}
        disableUnlock={true}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={inputCurrency}
        value={realyValue ? realyValue : ''}
        hideETH={true}
        selfUseAllToken={selfUseAllToken}
      />
      {bridgeType && bridgeType === 'redeem' ? (
        <>
          <AddressInputPanel title={t('recipient') + ' ' + (inputSymbol ? formatCoin(inputSymbol) : inputSymbol)  + ' ' + t('address')} onChange={setRecipient} onError={setRecipientError} initialInput={recipient} isValid={true} disabled={false} changeCount={recipientCount}/>
        </>
      ) : (
        isBTC(inputSymbol) && account && registerAddress ? (
          <>
          <InputPanel>
            <ContainerRow>
              <InputContainer>
                <LabelRow>
                  <LabelContainer>
                    <span>{t('deposit1') + ' ' + (inputSymbol ? formatCoin(inputSymbol) : inputSymbol)  + ' ' + t('address')}</span>
                  </LabelContainer>
                </LabelRow>
                <InputRow>
                  <Input type="text" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" placeholder="" value={account && registerAddress ? registerAddress : ''} readOnly/>
                  <Copy toCopy={registerAddress} />
                  <StyledQRcode size={'1.25rem'} onClick={MintModelView}></StyledQRcode>
                </InputRow>
              </InputContainer>
            </ContainerRow>
          </InputPanel>
        </>
        ) : ''
      )}
      {
        // isDeposit ? (
        isDeposit === 0 || isRedeem === 0 ? (
          (isDeposit === 0 && isRedeem === 0 ? 
            (
              <MintWarningTip>
                <img src={WarningIcon} alt='' style={{marginRight: '8px'}}/>
                <span dangerouslySetInnerHTML = { 
                  {__html: t('brStopTip')}
                }></span>
              </MintWarningTip>
            )
            : 
            ''
          )
        ) : ''
      }
      {
        registerAddress ? (
          <SubCurrencySelectBox>
            {
              bridgeType && bridgeType === 'redeem' ? (
                <>
                  <dl className='list'>
                    <dt>
                      <img src={BulbIcon} alt='' />
                      {t('Reminder')}:
                    </dt>
                    <dd><i></i>{t('redeemTip1', {
                      minFee,
                      coin: formatCoin(inputSymbol),
                      maxFee,
                      fee: fee * 100
                    })}</dd>
                    <dd><i></i>{t('redeemTip2')} {redeemMinNum} {formatCoin(inputSymbol)}</dd>
                    <dd><i></i>{t('redeemTip3')} {redeemMaxNum} {formatCoin(inputSymbol)}</dd>
                    <dd><i></i>{t('redeemTip4')},</dd>
                    <dd><i></i>{t('redeemTip5', {
                      redeemBigValMoreTime,
                      coin: formatCoin(inputSymbol),
                    })}</dd>
                  </dl>
                </>
              ) : (
                <>
                  <dl className='list'>
                    <dt>
                      <img src={BulbIcon} alt='' />
                      {t('Reminder')}:
                    </dt>
                    <dd><i></i>{t('mintTip1')},</dd>
                    <dd><i></i>{t('mintTip2')} {depositMinNum} {formatCoin(inputSymbol)}</dd>
                    <dd><i></i>{t('mintTip3')} {depositMaxNum} {formatCoin(inputSymbol)}</dd>
                    <dd><i></i>{t('mintTip4')}</dd>
                    <dd><i></i>{t('mintTip5', {
                      depositBigValMoreTime,
                      coin: formatCoin(inputSymbol),
                    }) + (inputSymbol ? '' : '')}</dd>
                    {
                      account && !isBTC(inputSymbol) ? (
                        walletTip()
                      ) : ''
                    }
                  </dl>
                </>
              )
            }
          </SubCurrencySelectBox>
        ) : ''
      }
      <WarningTip></WarningTip>
      {isDeposit || isRedeem ? (
        <>
          <Flex>
            {
              account ? viewBtn(bridgeType) : (
                <Button disabled={showBetaMessage} onClick={toggleWalletModal} >
                  {t('connectToWallet')}
                </Button>
              )
            }
          </Flex>
        </>
      ) : (
        <>
          <Flex>
            {
              isDeposit === 0 && isRedeem === 0 ? (
                <Button disabled={true}>
                  {t('ComineSoon')}
                </Button>
              ) : (
                <Button disabled={true}>
                  {t('CrossChainDeposit')}
                </Button>
              )
            }
          </Flex>
        </>
      )}
    </>
  )
}
