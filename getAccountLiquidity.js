const csv = require('csv-parser');
const fs = require('fs');
const { COMPTROLLER,comptrollerAbi,RPCURLS,CONTRACT_CBEP_ABI,C_TOKEN_NAME } = require('./constants')
const Web3 = require('web3');
const results = {
  "CELO":[],
  "BSC":[],
  "METER":[],
  'POLYGON':[]
};

async function ifLiquidity(web3,networkName, Borrower,index ) {
  const comptroller = new web3.eth.Contract(comptrollerAbi, COMPTROLLER[networkName]);
  try{
    const result = await comptroller.methods.getAccountLiquidity(Borrower).call();
    const {0: error, 1: liquidity, 2: shortfall} = result;
    if(shortfall>0){
      // console.log(`🚗--LiquidityAddress--`,Borrower)
      await liquidityData(web3,networkName,Borrower)
    }
  }catch(e){
    console.log(`👀ifLiquidity error${index}👀`,e)
  }
}

// liquidity
let borrowsData = {
  "CELO":[],
  "BSC":[],
  "METER":[],
  'POLYGON':[]
  }
async function liquidityData(web3,networkName, Borrower) {

  const comptroller = new web3.eth.Contract(comptrollerAbi, COMPTROLLER[networkName]);
  try{
    const markets = await comptroller.methods.getAssetsIn(Borrower).call();
    //  console.log(`🚗--LiquidityAddressMarkets--`,markets)
    let addressSituation = []

    await Promise.all(
      markets.map(async item => {
        res =  await getSnapshot(web3,item,Borrower)
        if (res) {
          addressSituation.push(res)
        }
      }),
      borrowsData[networkName].push(addressSituation)
    )
    // console.log(`🚗--LiquidityAddressMarketsSituation--`,addressSituation)
    await saveBorrowData(networkName,borrowsData)
  }catch(e){
    console.log('👀liquidity error👀',e)
  }
}

// Snapshot
async function getSnapshot(web3,cToken,Borrower){
  const comptroller = new web3.eth.Contract(CONTRACT_CBEP_ABI, cToken);
  try{
    let total = {}
    const shots = await comptroller.methods.getAccountSnapshot(Borrower).call();
    const {0: error, 1: cTokenBalance, 2: borrowBalance,3:exchangeRate} = shots;
    const save = (cTokenBalance / 1e18) * (exchangeRate / 1e18);
    const borrow = (borrowBalance / 1e18);
    const name = C_TOKEN_NAME[cToken]
    total = {
      save,
      borrow,
      cToken,
      Borrower,
      name
    }
    return total
  }catch(e){
    console.log('👀getSnapshot error👀',e)
  }
}


function saveBorrowData(net,data){
  const result = data[net].flat(Infinity)
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: `${net}_liquidity.csv`,
    header: [
      {id: 'save', title: 'save'},
      {id: 'borrow', title: 'borrow'},
      {id: 'cToken', title: 'cToken'},
      {id: 'Borrower', title: 'borrower'},
      {id: 'name', title: 'name'},
    ]
  });
  
  csvWriter
    .writeRecords(result)
    .then(()=> console.log('🚗----The CSV file was written successfully'));
}

function getData(networkName){
  const web3 = new Web3(RPCURLS[networkName])
  fs.createReadStream(`${networkName}_address.csv`)
  .pipe(csv())
  .on('data', (row) => {
    results[networkName].push(row)
  })
  .on('end', async() => {
    const dataLength = results[networkName].length
    if(dataLength<1000){
      await Promise.all(
        results[networkName].map(async (item,index) => {
          res =  await ifLiquidity(web3,networkName,item.address,index)
        }),
      )
    } else {
      const getCount = Math.ceil(dataLength/1000)
      for (let i= 0;i<getCount;i++) {
        const start = i *1000
        const end = start+1000
        await Promise.all(
          results[networkName].slice(start,end).map(async (item,index) => {
            res =  await ifLiquidity(web3,networkName,item.address,index)
          })
        )

      }
    }
  });
}


async function mainFunc( networkName ) {
  let result = {
    status: false,
  };
  try {
    await getData(networkName)

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`👀[mainFunc.js] Error👀: ${error.message}`);
  }
  return {
    status: 200,
    data: result,
  };
}
 const arr = ['BSC','POLYGON','CELO']

 arr.map(item=>{
  mainFunc(item)
})

