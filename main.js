const _ = require('lodash')

const fetch = require('isomorphic-fetch');

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

let borrows = []
async function getBorrowData(networkName, first=1000, lastBlockTime) {
  let queryWhere
  if (lastBlockTime) {
    queryWhere = `, where: { blockTime_lte: ${lastBlockTime} }`
  }
  const query = `
    {
      borrowEvents(orderBy: blockTime, orderDirection: desc, first: ${first}${queryWhere || ''}) {
        id
        amount
        accountBorrows
        borrower
        blockNumber
        blockTime
        underlyingSymbol
      }
    }
  `;
  console.log(first, lastBlockTime, query)
  let result = (await fetchSubgraph(networkName, query)).borrowEvents
  if (result.length > 0) {
    lastBlockTime = _.last(result).blockTime
    let removed = _.remove(result, (b) => b.blockTime === lastBlockTime)
    if (result.length === 0) {
      borrows = borrows.concat(removed)
      return
    }
    // console.log(result)
    borrows = borrows.concat(result)
    await getBorrowData(networkName, first, lastBlockTime)
  } else {
    borrows = borrows.concat(result)
    return
  }
}

async function getRepayData(networkName) {
  let first = 100, skip = 0
  const query = `
    {
      repayEvents(orderBy: blockTime, orderDirection: desc, first: ${first}, skip: ${skip}) {
        id
        amount
        accountBorrows
        borrower
        blockNumber
        blockTime
        underlyingSymbol
        payer
      }
    }
  `
  return await fetchSubgraph(networkName, query)
}

async function subgraph({ networkName }) {
  let result = {
    status: false,
  };
  try {
    await getBorrowData(networkName);
    console.log(borrows)
    // console.log(res.length)

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`[subgraph.js] Error: ${error.message}`);
  }
  return {
    status: 200,
    data: result,
  };
}

subgraph({
  networkName: 'CELO'
})
