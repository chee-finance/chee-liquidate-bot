const _ = require('lodash')
const fetch = require('node-fetch');
const moment = require('moment')


const SUBGRAPH_URL = {
  CELO: 'https://api.thegraph.com/subgraphs/name/cheenicey/chee-subgraph-alfajores',
  BSC: 'https://api.thegraph.com/subgraphs/name/cheenicey/chee-subgraph-bsc0',
  METER: '',
};

async function fetchSubgraph(networkName, query) {
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

function uniqueFunc(arr, uniId){
  const res = new Map();
  return arr.filter((item) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}

// csv
function saveBorrowData(data){
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'celo_address.csv',
  header: [
    {id: 'borrower', title: 'address'},
    {id: 'blockTime', title: 'blockTime'},
  ]
});

csvWriter
  .writeRecords(data)
  .then(()=> console.log('🚗----The CSV file was written successfully'));

}

let borrows = []
async function getBorrowData(networkName, first=1000, lastBlockTime) {
  let queryWhere
  if (lastBlockTime) {
    queryWhere = `, where: { blockTime_lte: ${lastBlockTime} }`
  }
  const query = `
    {
      borrowEvents(orderBy: blockTime, orderDirection: desc, first: ${first}${queryWhere || ''}) {
        borrower
        blockTime
      }
    }
  `;
  console.log('🚗----getBorrowData time',moment().format('hh:mm:ss'))
  let result = (await fetchSubgraph(networkName, query)).borrowEvents
  if (result.length > 0) {
    lastBlockTime = _.last(result).blockTime
    let removed = _.remove(result, (b) => b.blockTime === lastBlockTime)
    if (result.length === 0) {
      borrows = borrows.concat(removed)
      return
    }
    const filterResult = uniqueFunc(result,'borrower')
    borrows = borrows.concat(filterResult)
    await getBorrowData(networkName, first, lastBlockTime)
  } else {
    borrows = borrows.concat(result)
    return
  }
}

async function subgraph({ networkName }) {
  let result = {
    status: false,
  };
  try {
    console.log('🚗---start🚗',moment().format('hh:mm:ss'))
    await getBorrowData(networkName);
    await saveBorrowData(borrows)

    console.log('👀total data👀',borrows.length)
    console.log('🚗---end🚗',moment().format('hh:mm:ss'))

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`👀[subgraph.js] Error👀: ${error.message}`);
  }
  return {
    status: 200,
    data: result,
  };
}

subgraph({
  networkName: 'CELO'
})