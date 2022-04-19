const csv = require('csv-parser');
const fs = require('fs');
const { COMPTROLLER,comptrollerAbi,RPCURLS,CONTRACT_CBEP_ABI } = require('./constants')
const Web3 = require('web3')



async function ifLiquidity( networkName, Borrower ) {
  const web3 = new Web3(RPCURLS[networkName])
  const comptroller = new web3.eth.Contract(comptrollerAbi, COMPTROLLER[networkName]);
  try{
    const result = await comptroller.methods.getAccountLiquidity(Borrower).call();
    const {0: error, 1: liquidity, 2: shortfall} = result;
    if(shortfall>0){
      console.log(`🚗--LiquidityAddress--`,Borrower)
      liquidityData(networkName,Borrower)
    }
  }catch(e){
    console.log('👀ifLiquidity error👀',e)
  }
}

// liquidity
async function liquidityData(networkName, Borrower) {
  const web3 = new Web3(RPCURLS[networkName])
  const comptroller = new web3.eth.Contract(comptrollerAbi, COMPTROLLER[networkName]);
  try{
    const markets = await comptroller.methods.getAssetsIn(Borrower).call();
    console.log(`🚗--LiquidityAddressMarkets--`,markets)
    let addressSituation = []

    await Promise.all(
      markets.map(async item => {
        res =  await getSnapshot(networkName,item,Borrower)
        if (res) {
          addressSituation.push(res)
        }
      }),
    )
    console.log(`🚗--LiquidityAddressMarketsSituation--`,addressSituation)
  }catch(e){
    console.log('👀liquidity error👀',e)
  }
}

// Snapshot
async function getSnapshot(networkName, cToken,Borrower){
  const web3 = new Web3(RPCURLS[networkName])
  const comptroller = new web3.eth.Contract(CONTRACT_CBEP_ABI, cToken);
  try{
    let total = {}
    const shots = await comptroller.methods.getAccountSnapshot(Borrower).call();
    const {0: error, 1: cTokenBalance, 2: borrowBalance,3:exchangeRate} = shots;
    const save = (cTokenBalance / 1e18) * (exchangeRate / 1e18);
    const borrow = (borrowBalance / 1e18);
    total = {
      save,
      borrow,
      cToken,
      Borrower
    }
    console.log('total',total)
    return total
  }catch(e){
    console.log('👀getSnapshot error👀',e)
  }
}


function getData(networkName){
  fs.createReadStream(`${networkName}_address.csv`)
  .pipe(csv())
  .on('data', (row) => {
    // console.log(row);
    ifLiquidity(networkName,row.address)
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });
}

// getData('BSC')

ifLiquidity('BSC','0xd59f470c6f647a447031574696d8c27b9b6cc776')