const PQueue = require('p-queue')
const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { BlockQueue } = require('../models')

const BLOCKS_PER_CALL = 2000
const DATAS_PER_BATCH = 500
const SCRAPE_RETRIES = 10
const MAX_QUEUE_ATTEMPT = 10
const MAX_BLOCK_MULT = 10
const TASK_INTERVAL = 5 // in seconds

let STARTING_BLOCK = 9000437
let CURRENT_BLOCK = STARTING_BLOCK
let END_BLOCK = STARTING_BLOCK + (BLOCKS_PER_CALL * MAX_BLOCK_MULT)

process.argv.forEach((val) => {
  if (val.startsWith('--start')) {
    STARTING_BLOCK = parseInt(val.split('=')[1])
    CURRENT_BLOCK = STARTING_BLOCK
    END_BLOCK = STARTING_BLOCK + (BLOCKS_PER_CALL * MAX_BLOCK_MULT)
  }
})

const mainQueue = new PQueue({ concurrency: 50 })

let toProcess = []

const start = async () => {
  const itemQueue = queue('transaction')

  const bQueue = await BlockQueue.findOne({ type: 'transaction' })
  if (bQueue) {
    if (bQueue.currentBlock > bQueue.startingBlock && bQueue.currentBlock < bQueue.endBlock) {
      STARTING_BLOCK = parseInt(bQueue.currentBlock)
      END_BLOCK = parseInt(bQueue.endBlock)
    } else if (bQueue.currentBlock >= bQueue.endBlock) {
      STARTING_BLOCK = parseInt(bQueue.startingBlock + (BLOCKS_PER_CALL * MAX_BLOCK_MULT))
      END_BLOCK = STARTING_BLOCK + (BLOCKS_PER_CALL * MAX_BLOCK_MULT)
    } else {
      STARTING_BLOCK = parseInt(bQueue.startingBlock)
      END_BLOCK = STARTING_BLOCK + (BLOCKS_PER_CALL * MAX_BLOCK_MULT)
    }
  }

  const runQueue = (fromBlock) => async () => {
    let results = await pRetry(() => web3Helper
      .getToken()
      .getPastEvents('Transfer', {
        fromBlock,
        toBlock: fromBlock + BLOCKS_PER_CALL
      }),
    { retries: SCRAPE_RETRIES })

    results = results.filter(result => (result.returnValues.from === web3Helper.getCryptoBladesAddress() || result.returnValues.to === web3Helper.getCryptoBladesAddress()))

    logger('info', 'trans', 'queue', `${fromBlock} ${results.length} ${BLOCKS_PER_CALL}`)

    results.forEach(result => {
      const { from, to, value } = result.returnValues
      toProcess.push({
        hash: result.transactionHash,
        from,
        to,
        value
      })
      checkToProcess(DATAS_PER_BATCH)
    })

    CURRENT_BLOCK += BLOCKS_PER_CALL

    await BlockQueue.findOneAndUpdate({ type: 'transaction' }, {
      startingBlock: STARTING_BLOCK,
      currentBlock: CURRENT_BLOCK,
      endBlock: END_BLOCK
    }, {
      new: true,
      upsert: true
    })
  }

  const checkToProcess = async (maxLength) => {
    if (toProcess.length >= maxLength) {
      const items = [...toProcess]
      toProcess = []
      itemQueue.add(items, { attempts: MAX_QUEUE_ATTEMPT })
    }
  }

  mainQueue.add(runQueue(STARTING_BLOCK), { priority: MAX_BLOCK_MULT })
  for (let i = 1; i < MAX_BLOCK_MULT; i += 1) {
    mainQueue.add(runQueue(STARTING_BLOCK + (BLOCKS_PER_CALL * i)), { priority: MAX_BLOCK_MULT - i })
  }

  await mainQueue.onIdle()

  await checkToProcess(0)
  // process.exit(0)
  setTimeout(() => {
    start()
  }, TASK_INTERVAL * 1000)
}

start()
