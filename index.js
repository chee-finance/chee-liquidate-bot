const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')
const getAccount = require('./getAccount').getAccount

const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = ContractKit.newKitFromWeb3(web3)

const CTokenAbi = require('./abi/CToken.json')
const CBep20Abi = require('./abi/CBep20.json')

const args = process.argv.slice(2)
// const borrower = '0x31bE3B3F802886Fac0a1E0cf0984B7e6734f9e1D';
// const cToken = '0xD927502Da7A7759A132469212c7fa69d2198e344';
// const underlying = '0xD98B00822A950F09F5C4De6B081A67764519a286';
// const collateral = '0xa86b824475C6C697E9d4A819E111dd3236b089C3';
const defaultAmount = web3.utils.toWei('50000000000000')
// const repayAmount = web3.utils.toWei('0.01');

const [borrower, cToken, underlying, collateral, repayAmount] = args

async function initContract () {
  if (args.length < 5) {
    // eslint-disable-next-line no-throw-literal
    throw ('missing liquidator parameters!')
  }
  const instance = new web3.eth.Contract(
    CTokenAbi,
    cToken
  )

  const token = new web3.eth.Contract(
    CBep20Abi,
    underlying
  )

  getName(token)
  liquidateBorrow(instance, token)
}

async function getName (instance) {
  const name = await instance.methods.name().call()
  console.log(name)
}

async function liquidateBorrow (instance, token) {
  try {
    const account = await getAccount()
    const amount = web3.utils.toWei(repayAmount)

    kit.connection.addAccount(account.privateKey)

    // approve
    let txObject = await token.methods.approve(cToken, defaultAmount)
    let tx = await kit.sendTransactionObject(txObject, { from: account.address })
    await tx.waitReceipt()
    console.log('approve finished!')

    // liquidate
    txObject = await instance.methods.liquidateBorrow(borrower, amount, collateral)
    tx = await kit.sendTransactionObject(txObject, { from: account.address })
    await tx.waitReceipt()
    console.log(`liquidation ${borrower} finished!`)
  } catch (e) {
    console.log(e, 'tx failed')
  }
}

initContract().catch(console.log)
