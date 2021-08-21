const PQueue = require('p-queue')
const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')

let STARTING_BLOCK = process.env.STARTING_BLOCK || 9000437
const BLOCKS_PER_CALL = 2000
const DATAS_PER_BATCH = 500
const SCRAPE_RETRIES = 10
const MAX_QUEUE_ATTEMPT = 10

process.argv.forEach((val) => {
  if (val.startsWith('--start')) STARTING_BLOCK = parseInt(val.split('=')[1])
})

const mainQueue = new PQueue({ concurrency: 50 })

let toProcess = []

const start = async () => {
  const latestBlock = await web3Helper.getLatestBlock()
  const itemQueue = queue('fight')

  const runQueue = (fromBlock) => async () => {
    const results = await pRetry(() => web3Helper
      .getCryptoBlades()
      .getPastEvents('FightOutcome', { fromBlock, toBlock: fromBlock + BLOCKS_PER_CALL }),
    { retries: SCRAPE_RETRIES })

    console.log(
      '[FIGHT QUEUE]',
      fromBlock,
      results.length,
      BLOCKS_PER_CALL
    )

    results.forEach(result => {
      toProcess.push({
        owner: result.returnValues[0],
        character: result.returnValues[1],
        weapon: result.returnValues[2],
        target: result.returnValues[3],
        playerRoll: result.returnValues[4],
        enemyRoll: result.returnValues[5],
        xpGain: result.returnValues[6],
        skillGain: result.returnValues[7]
      })
      checkToProcess(DATAS_PER_BATCH)
    })
  }

  const checkToProcess = async (maxLength) => {
    if (toProcess.length >= maxLength) {
      const items = [...toProcess]
      toProcess = []
      itemQueue.add(items, { attempts: MAX_QUEUE_ATTEMPT })
    }
  }

  const start = STARTING_BLOCK
  const end = Math.floor((parseInt(latestBlock.number) - start) / BLOCKS_PER_CALL)
  mainQueue.add(runQueue(start))
  for (let i = 0; i < end; i += 1) {
    mainQueue.add(runQueue(start + (BLOCKS_PER_CALL * i)))
  }

  await mainQueue.onIdle()

  checkToProcess(0)
}

start()
