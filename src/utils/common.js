import store from '../store'
import axios from 'axios'
import {
  ElMessage,
  ElNotification
} from 'element-plus'

async function sendRequest(apilink, type, jsonObject, api_token) {
  // axios.defaults.timeout = 60000
  // axios.defaults.headers.common['Authorization'] = `Bearer ${api_token?api_token:store.state.accessToken}`
  try {
    let response
    switch (type) {
      case 'post':
        response = await axios.post(apilink, jsonObject)
        return response.data
      case 'put':
        response = await axios.put(apilink, jsonObject)
        return response.data
      case 'get':
        response = await axios.get(apilink)
        return response.data
      case 'delete':
        response = await axios.delete(apilink, {
          data: jsonObject
        })
        return response.data
    }
  } catch (err) {
    console.error(err, err.response)
    notificationTip(err.response ? err.response.statusText : 'Request failed. Please try again later!', 'error')
    // messageTip('error', err.response ? err.response.statusText : 'Request failed. Please try again later!')
    if (err.response) {
      // The request has been sent, but the status code of the server response is not within the range of 2xx
      // console.log(err.response.data)
      // console.log(err.response.status)
      // console.log(err.response.headers)
      return err.response.data
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.log('Error', err.message)
      return err
    }
  }
}

async function timeout(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

async function messageTip(type, text) {
  ElMessage({
    showClose: true,
    message: text,
    type: type,
  })
}

async function notificationTip(title, type, message) {
  if (message) await copyContent(message, 'Copied')
  ElNotification({
    title: title,
    // message: message,
    type: type,
    position: 'bottom-right'
  })
}

function sizeChange(bytes) {
  if (bytes === 0) return '0 B'
  if (!bytes) return '-'
  var k = 1024 // or 1000
  var sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  var i = Math.floor(Math.log(bytes) / Math.log(k))

  if (Math.round((bytes / Math.pow(k, i))).toString().length > 3) i += 1
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function copyContent(text, tipCont) {
  var txtArea = document.createElement('textarea')
  txtArea.id = 'txt'
  txtArea.style.position = 'fixed'
  txtArea.style.top = '0'
  txtArea.style.left = '0'
  txtArea.style.opacity = '0'
  txtArea.value = text
  document.body.appendChild(txtArea)
  txtArea.select()

  try {
    var successful = document.execCommand('copy')
    var msg = successful ? 'successful' : 'unsuccessful'
    console.log('Copying text command was ' + msg)
    if (successful) {
      // messageTip('success', tipCont)
      return true
    }
  } catch (err) {
    console.log('Oops, unable to copy')
  } finally {
    document.body.removeChild(txtArea)
  }
  return false
}

function goLink(link) {
  if (!link) return
  window.open(link)
}


async function Init(callback) {
  if (typeof window.ethereum === 'undefined') {
    // goLink('https://metamask.io/download.html')
    alert("Consider installing MetaMask!");
  } else {
    const ethereum = window.ethereum;
    ethereum
      .request({
        method: 'eth_requestAccounts'
      })
      .then(async (accounts) => {
        if (!accounts) {
          callback('')
          return false
        }

        const chainNet = await walletChain()
        const chainId = await web3Init.eth.net.getId()
        await web3Init.eth.getAccounts().then(async webAccounts => {
            store.dispatch('setMetaAddress', webAccounts[0])
            callback(webAccounts[0], chainId === Number(process.env.VUE_APP_CHAINID))
          })
          .catch(async (error) => {
            store.dispatch('setMetaAddress', accounts[0])
            callback(accounts[0], chainId === Number(process.env.VUE_APP_CHAINID))
          })
      })
      .catch((error) => {
        if (error === "User rejected provider access") {} else {
          alert("Please unlock MetaMask and switch to the correct network.");
          return false
        }
        console.error(
          `Error fetching accounts: ${error.message}.
        Code: ${error.code}. Data: ${error.data}`
        );
      });
  }
}

async function walletChain(chainId) {
  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: web3Init.utils.numberToHex(137),
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC', // 2-6 characters long
          decimals: 18
        },
        rpcUrls: [process.env.VUE_APP_POLYGONRPCURL],
        blockExplorerUrls: [process.env.VUE_APP_POLYGONBLOCKURL]
      }]
    })
  } catch {}
}

async function checkDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true
  else return false
}

async function checkMode() {
  let mode = false
  const check = await checkDarkMode()
  if (String(store.state.reverse) === '1') mode = true
  else if (String(store.state.reverse) === '2') mode = false
  else mode = check

  if (mode) document.querySelector('html').classList.add('dark')
  else document.querySelector('html').classList.remove('dark')
  return mode
}

let web3Init
if (typeof window.ethereum === 'undefined') {
  // window.open('https://metamask.io/download.html')
  // alert("Consider installing MetaMask!");
} else {
  if (window.ethereum) {
    web3 = new Web3(ethereum);
    web3.setProvider(ethereum);
  } else if (window.web3) {
    web3 = window.web3;
    console.log("Injected web3 detected.");
  } else {
    var currentProvider = web3.currentProvider;
    web3 = new Web3(currentProvider);
    web3.setProvider(currentProvider);
    console.log("No web3 instance injected, using Local web3.");
  }
  web3Init = web3
}

window.addEventListener('resize', () => {
  let client = document.body.clientWidth < 992 ? false : true
  store.dispatch('setClientWidth', client)
})

export default {
  sendRequest,
  timeout,
  messageTip,
  notificationTip,
  sizeChange,
  copyContent,
  goLink,
  Init,
  web3Init,
  checkDarkMode,
  checkMode
}