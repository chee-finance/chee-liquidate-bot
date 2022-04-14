
const  fetch = require('node-fetch')
const { SUBGRAPH_URL } = require('./constants')



async function getSubgraphData(networkName) {
  const query = `
      {
        comptrollers(first: 5) {
          id
          priceOracle
          closeFactor
          liquidationIncentive
        }
        markets {
          borrowRate
          supplyRate
          cash
          collateralFactor
          exchangeRate
          interestRateModelAddress
          name
          reserves
          symbol
          id
          totalBorrows
          totalSupply
          underlyingAddress
          underlyingName
          underlyingPrice
          underlyingSymbol
          accrualBlockNumber
          blockTimestamp
          borrowIndex
          reserveFactor
          underlyingPriceUSD
          underlyingDecimals
        }
      }
    `;

  if (networkName === 'METER') {
    return {
      comptrollers: [
        {
          closeFactor: '500000000000000000',
          id: '1',
          liquidationIncentive: '1100000000000000000',
          priceOracle: '0x615fbf0fd79d5e69b528dc997359594b6756d0f4',
        },
      ],
      markets: [
        {
          accrualBlockNumber: 0,
          blockTimestamp: 0,
          borrowIndex: '0',
          borrowRate: '0',
          cash: '0',
          collateralFactor: '0',
          exchangeRate: '0',
          id: '0x3DAbb7bAED79c2df12DEDDaCE50c7a53ef0865cE',
          interestRateModelAddress: '0xa00d904161B397c171b6B16A5e96Aea97A03055f',
          name: 'cCHEE',
          reserveFactor: '0',
          reserves: '0',
          supplyRate: '0',
          symbol: 'cCHEE',
          totalBorrows: '0',
          totalSupply: '0',
          underlyingAddress: '0xa3045650BB100420fa18763276aad9CFD2C61F5b',
          underlyingDecimals: 18,
          underlyingName: 'CHEE Fiance',
          underlyingPrice: '0',
          underlyingPriceUSD: '0',
          underlyingSymbol: 'CHEE',
        },
        {
          accrualBlockNumber: 16293461,
          blockTimestamp: 1643478403,
          borrowIndex: '1.88600291976864661',
          borrowRate: '0.00000005',
          cash: '58.279230996541129273',
          collateralFactor: '0.5',
          exchangeRate: '0.2',
          id: '0x4c0D4A750BAadE16A4031740Bc433D0a9eC50C82',
          interestRateModelAddress: '0xa00d904161B397c171b6B16A5e96Aea97A03055f',
          name: 'cBTC',
          reserveFactor: '0',
          reserves: '0',
          supplyRate: '0.00000005',
          symbol: 'cBTC',
          totalBorrows: '74339.23800154573348',
          totalSupply: '229678.278021',
          underlyingAddress: '0xD56B78A6a04B9d6739551FD46c9C7ffE65703CEe',
          underlyingDecimals: 18,
          underlyingName: 'BTC',
          underlyingPrice: '43000',
          underlyingPriceUSD: '43000',
          underlyingSymbol: 'BTC',
        },
        {
          accrualBlockNumber: 16255492,
          blockTimestamp: 1643363416,
          borrowIndex: '1.54322200606790127',
          borrowRate: '0.00000005',
          cash: '18.9',
          collateralFactor: '0.5',
          exchangeRate: '0.2',
          id: '0x324F0403394f2d300E186B76695386598a5F7342',
          interestRateModelAddress: '0xa00d904161B397c171b6B16A5e96Aea97A03055f',
          name: 'cETH',
          reserveFactor: '0',
          reserves: '0',
          supplyRate: '0.00000005',
          symbol: 'cETH',
          totalBorrows: '11052.56897868485337',
          totalSupply: '99973.72932',
          underlyingAddress: '0x5C31081C6EF3c70D5fa7a848f92e1da3d4522F14',
          underlyingDecimals: 18,
          underlyingName: 'ETH',
          underlyingPrice: '3200',
          underlyingPriceUSD: '3200',
          underlyingSymbol: 'ETH',
        },
        {
          accrualBlockNumber: 16293499,
          blockTimestamp: 1643478554,
          borrowIndex: '1.73012',
          borrowRate: '0.00000005',
          cash: '0.1',
          collateralFactor: '0.5',
          exchangeRate: '0.2',
          id: '0xC791F499786D8d48D9A8f751C5b98A91d3D026C8',
          interestRateModelAddress: '0xa00d904161B397c171b6B16A5e96Aea97A03055f',
          name: 'cMTR',
          reserveFactor: '0',
          reserves: '0',
          supplyRate: '0.00000005',
          symbol: 'cMTR',
          totalBorrows: '1023000.67',
          totalSupply: '5437891.23',
          underlyingAddress: '0x0000000000000000000000000000000000000000',
          underlyingDecimals: 18,
          underlyingName: 'Meter Coin',
          underlyingPrice: '1',
          underlyingPriceUSD: '1',
          underlyingSymbol: 'MTR',
        },
        {
          accrualBlockNumber: 16255231,
          blockTimestamp: 1643362633,
          borrowIndex: '1.538485',
          borrowRate: '0.00000005',
          cash: '50000',
          collateralFactor: '0.7',
          exchangeRate: '0.2',
          id: '0xe6Df0f0aD3C1Fd36FF45845b2B26CdF33C67007C',
          interestRateModelAddress: '0xa00d904161B397c171b6B16A5e96Aea97A03055f',
          name: 'cUSDT',
          reserveFactor: '0',
          reserves: '0',
          supplyRate: '0.00000005',
          symbol: 'cUSDT',
          totalBorrows: '100000000',
          totalSupply: '2500000000',
          underlyingAddress: '0x378ea97eb04d3836D8b39C67a1ca99725B3e55B0',
          underlyingDecimals: 18,
          underlyingName: 'USDT',
          underlyingPrice: '1',
          underlyingPriceUSD: '1',
          underlyingSymbol: 'USDT',
        },
      ],
    };
  }

  const response = await fetch(SUBGRAPH_URL[networkName], {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
    }),
  });
  const { data } = await response.json();
  return data;
}


async function getAddress(networkName){
  let result={
    status:false,
    data:null
  }
  if(!networkName){
    return result
  }
  try{
    let subgraphData = await getSubgraphData(networkName)

  }catch(error){
    console.log(`👀${error}👀`)
  } finally{
    return result
  }
}

 getAddress('CELO')