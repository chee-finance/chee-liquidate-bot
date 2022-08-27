const csv = require('csv-parser')
const fs = require('fs')
const { COMPTROLLER, comptrollerAbi, RPCURLS, CONTRACT_CBEP_ABI, C_TOKEN_NAME } = require('./constants')
const Web3 = require('web3')
const { subgraph } = require('./main.js')
const moment = require('moment')
const getDbData = require('./db')
const  schedule = require('node-schedule')
let results = {
  CELO: [],
  BSC: [],
  METER: [],
  POLYGON: []
}

let errorData = {
  CELO: [],
  BSC: [],
  METER: [],
  POLYGON: []
}
async function ifLiquidity (web3, networkName, Borrower) {
  const comptroller = new web3.eth.Contract(comptrollerAbi, COMPTROLLER[networkName])
  try {
    const result = await comptroller.methods.getAccountLiquidity(Borrower).call()
    const { 2: shortfall } = result
    if (shortfall > 0) {
      // console.log(`🚗--LiquidityAddress--`,Borrower)
      await liquidityData(web3, networkName, Borrower)
    }
    if (errorData[networkName].indexOf(Borrower) !== -1) {
      errorData[networkName].push(Borrower)
    }
  } catch (e) {
    console.log(`👀ifLiquidity error${Borrower}👀`, e)
    if (errorData[networkName].indexOf(Borrower) === -1) {
      errorData[networkName].push(Borrower)
      console.log('errorData', errorData)
    }
  }
}

// liquidity
let borrowsData = {
  CELO: [],
  BSC: [],
  METER: [],
  POLYGON: []
}

async function liquidityData (web3, networkName, Borrower) {
  const comptroller = new web3.eth.Contract(comptrollerAbi, COMPTROLLER[networkName])
  try {
    const markets = await comptroller.methods.getAssetsIn(Borrower).call()
    const addressSituation = []

    await Promise.all(
      markets.map(async item => {
        const res = await getSnapshot(web3, item, Borrower, networkName)
        if (res) {
          addressSituation.push(res)
        }
      }),
      borrowsData[networkName].push(addressSituation)
    )
  } catch (e) {
    console.log(`👀liquidity error👀${Borrower}`, e)
    errorData[networkName].push(Borrower)
    console.log('errorData', errorData)
  }
}

// Snapshot
async function getSnapshot (web3, cToken, Borrower, networkName) {
  const comptroller = new web3.eth.Contract(CONTRACT_CBEP_ABI, cToken)
  try {
    let total = {}
    const shots = await comptroller.methods.getAccountSnapshot(Borrower).call()
    const { 1: cTokenBalance, 2: borrowBalance, 3: exchangeRate } = shots
    const save = (cTokenBalance / 1e18) * (exchangeRate / 1e18)
    const borrow = (borrowBalance / 1e18)
    const name = C_TOKEN_NAME[cToken]
    total = {
      save,
      borrow,
      cToken,
      Borrower,
      name
    }
    return total
  } catch (e) {
    console.log('👀getSnapshot error👀', e)
    errorData[networkName].push(Borrower)
    console.log('errorData', errorData)
  }
}

async function saveBorrowData (net, data) {
   const result = data[net].flat(Infinity)
  const createCsvWriter = require('csv-writer').createObjectCsvWriter
  const csvWriter = createCsvWriter({
    path: `${net}_liquidity.csv`,
    header: [
      { id: 'save', title: 'save' },
      { id: 'borrow', title: 'borrow' },
      { id: 'cToken', title: 'cToken' },
      { id: 'Borrower', title: 'borrower' },
      { id: 'name', title: 'name' }
    ]
  })

  csvWriter
    .writeRecords(result)
    .then(() => console.log('🚗----The CSV file was written successfully'))
    const values = result.map(
      (item) => `("${item.save}", "${item.borrow}", "${item.cToken}", "${item.Borrower}","${item.name}","${moment().unix()}")`,
    )
    await saveDataToDb({
        table:`${net}_liquidity`,
        values: values.join(','),
    })
 
}

async function saveDataToDb (arg) {

  const sql = `   
    INSERT INTO
    ${arg.table}
    (save, borrow, ctoken, borrower,name,unix)
    VALUES
    ${arg.values}
    `
   getDbData(sql); 
}

function getData (networkName) {
  const web3 = new Web3(RPCURLS[networkName])
  fs.createReadStream(`${networkName}_address.csv`)
    .pipe(csv())
    .on('data', (row) => {
      results[networkName].push(row)
    })
    .on('end', async () => {
      const dataLength = results[networkName].length
      if (dataLength < 20) {
        await Promise.all(
          results[networkName].map(async (item, index) => {
            await ifLiquidity(web3, networkName, item.address, index)
          })
        )
      } else {
        const getCount = Math.ceil(dataLength / 20)
        for (let i = 0; i < getCount; i++) {
          const start = i * 20
          const end = start + 20
          await Promise.all(
            results[networkName].slice(start, end).map(async (item, index) => {
              await ifLiquidity(web3, networkName, item.address, index)
            })
          )
        }
      }
    })
}

async function mainFunc (networkName) {
  const result = {
    status: false
  }
  try {
    getData(networkName)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`👀[mainFunc.js] Error👀: ${error.message}`)
  }
  return {
    status: 200,
    data: result
  }
}

function task () {
  ['CELO', 'BSC', 'METER', 'POLYGON'].forEach(item => {
    console.log('🚗---Step1:get Address', moment().format('hh:mm:ss'))
    subgraph({
      networkName: item
    })
  })
  const arr = ['BSC', 'POLYGON', 'CELO']

  setTimeout(() => {
    console.log('🚗---Step2:get all Info', moment().format('hh:mm:ss'))
    arr.forEach(item => {
      mainFunc(item)
    })
  }, 2000 * 60)


  setTimeout(() => {
    console.log('🚗---Step4:del old data', moment().format('hh:mm:ss'))
    arr.forEach(item => {
      const delSql = `   
    delete from
    ${item}_liquidity
    `
   getDbData(delSql); 
    })
  }, 4500 * 60)

  setTimeout(() => {
    console.log('🚗---Step5:save data', moment().format('hh:mm:ss'))
    console.log('errorData', errorData)
    arr.forEach(item => {
      saveBorrowData(item, borrowsData)
    })
  }, 5000 * 60)

  // // delFile
  setTimeout(() => {
    arr.forEach(item => {
      fs.access(`${item}_address.csv`, fs.constants.F_OK, (err) => {
        if (err) {
          console.error('File does not exist');
        }
        else {
          fs.unlinkSync(`${item}_address.csv`);
        }
      })
      fs.access(`${item}_liquidity.csv`, fs.constants.F_OK, (err) => {
        if (err) {
          console.error('File does not exist');
        }
        else {
          fs.unlinkSync(`${item}_liquidity.csv`);
        }
      })
    });

  }, 9000 * 60)
}
task()



const  scheduleTask = ()=>{
  //  12：00:'0 0 0 * * *'
  schedule.scheduleJob('0 0 0 * * *',()=>{
    results = {
      CELO: [],
      BSC: [],
      METER: [],
      POLYGON: []
    }
  
    errorData = {
      CELO: [],
      BSC: [],
      METER: [],
      POLYGON: []
    }
  
    borrowsData = {
      CELO: [],
      BSC: [],
      METER: [],
      POLYGON: []
    }
    task()
  })
}

scheduleTask() 
