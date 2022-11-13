const _ = require('lodash')
const fetch = require('node-fetch')
const moment = require('moment')
const { SUBGRAPH_URL } = require('./constants')
const env = process.env.REACT_APP_AWS_ENV

async function fetchSubgraph (networkName, query) {
  const response = await fetch(SUBGRAPH_URL[networkName], {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query
    })
  })
  const { data } = await response.json()
  return data
}

function uniqueFunc (arr, uniId) {
  const res = new Map()
  return arr.filter((item) => !res.has(item[uniId]) && res.set(item[uniId], 1))
}

// csv
function saveBorrowData (networkName, data) {
  const createCsvWriter = require('csv-writer').createObjectCsvWriter
  const csvWriter = createCsvWriter({
    path: `${networkName}_address_${env}.csv`,
    header: [
      { id: 'borrower', title: 'address' },
      { id: 'blockTime', title: 'blockTime' }
    ]
  })

  csvWriter
    .writeRecords(data)
    .then(() => console.log('🚗----The CSV file was written successfully'))
}

let borrowsData = {
  CELO: [],
  BSC: [],
  METER: [],
  POLYGON: []
}
async function getBorrowData (networkName, first = 1000, lastBlockTime) {
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
  `
  // console.log('🚗----getBorrowData time',moment().format('hh:mm:ss'))
  const result = (await fetchSubgraph(networkName, query)).borrowEvents
  if (result.length > 0) {
    lastBlockTime = _.last(result).blockTime
    const removed = _.remove(result, (b) => b.blockTime === lastBlockTime)
    if (result.length === 0) {
      borrowsData[networkName] = borrowsData[networkName].concat(removed)
      return
    }
    const filterResult = uniqueFunc(result, 'borrower')
    borrowsData[networkName] = borrowsData[networkName].concat(filterResult)
    await getBorrowData(networkName, first, lastBlockTime)
  } else {
    borrowsData[networkName] = borrowsData[networkName].concat(result)
  }
}

async function subgraph ({ networkName }) {
  const result = {
    status: false
  }
  try {
    borrowsData = {
      CELO: [],
      BSC: [],
      METER: [],
      POLYGON: []
    }
    console.log('🚗---start🚗', moment().format('hh:mm:ss'))
    await getBorrowData(networkName)
    await saveBorrowData(networkName, borrowsData[networkName])

    console.log(`👀--${networkName}--total data👀`, borrowsData[networkName].length)
    console.log('🚗---end🚗', moment().format('hh:mm:ss'))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`👀[subgraph.js] Error👀: ${error.message}`)
  }
  return {
    status: 200,
    data: result
  }
}

module.exports = {
  subgraph
}
