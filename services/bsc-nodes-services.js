const CryptoBladesABI = require('../contracts/CryptoBlades.json')
const {
  createWeb3ContractsServices,
  createLoadBalancedContractsService
} = require('web3-load-balance')

const contractsServices = createWeb3ContractsServices(
  [
    'https://bsc-dataseed.binance.org/',
    'https://bsc-dataseed1.defibit.io/',
    'https://bsc-dataseed1.ninicoin.io/',
    'https://bsc-dataseed2.defibit.io/',
    'https://bsc-dataseed3.defibit.io/',
    'https://bsc-dataseed4.defibit.io/',
    'https://bsc-dataseed2.ninicoin.io/',
    'https://bsc-dataseed3.ninicoin.io/',
    'https://bsc-dataseed4.ninicoin.io/',
    'https://bsc-dataseed1.binance.org/',
    'https://bsc-dataseed2.binance.org/',
    'https://bsc-dataseed3.binance.org/',
    'https://bsc-dataseed4.binance.org/'
  ],
  {
    cryptoblades: {
      abi: CryptoBladesABI,
      address: '0x39Bea96e13453Ed52A734B6ACEeD4c41F57B2271'
    }
  }
)

const web3BalancedService = createLoadBalancedContractsService(contractsServices)

exports.web3BalancedService = web3BalancedService

const fetchInGameOnlyFunds = async (startingNumber = 0) => {
  return Promise.all(
    Array(2000).fill(0).map(async (_, index) => {
      const currentNodeIndex = web3BalancedService.nodeIndex()

      /**
       * `NOTE` This is similar to
       *
       * ```
       * CryptoBladesContract.methods
       *  .inGameOnlyFunds('0xF9BDE92bF245c3CeB30bc556AE1D56E05bF56335)
       *  .call({
       *    from: "0x0000000000000000000000000000000000000000"
       *  })
       * ```
       */
      const result = web3BalancedService.onContract(
        'cryptoblades',
        (contract) => contract
          .methods
          .inGameOnlyFunds('0xF9BDE92bF245c3CeB30bc556AE1D56E05bF56335')
          .call({ from: '0x0000000000000000000000000000000000000000' })
      )
        .then((value) => {
          console.log(
            'Node:',
            currentNodeIndex,
            '/ value >>',
            value,
            '/ #',
            startingNumber + index
          )

          return value
        })

      // const result = web3BalancedService.runContract(
      //   'cryptoblades',
      //   'inGameOnlyFunds',
      //   ['0xF9BDE92bF245c3CeB30bc556AE1D56E05bF56335'],
      //   { form: '0x0000000000000000000000000000000000000000' }
      // )
      //   .then((value) => {
      //     console.log(
      //       'Node:',
      //       currentNodeIndex,
      //       '/ value >>',
      //       value,
      //       '/ #',
      //       startingNumber + index
      //     )

      //     return value
      //   })

      return result
    })
  )
}

const run = async () => {
  const startedTime = Date.now()

  const result = await Promise.all([
    fetchInGameOnlyFunds(0),
    fetchInGameOnlyFunds(2000),
    fetchInGameOnlyFunds(4000),
    fetchInGameOnlyFunds(6000),
    fetchInGameOnlyFunds(8000)
  ])

  // const result = await Promise.all([
  //   fetchInGameOnlyFunds(0),
  //   fetchInGameOnlyFunds(2000),
  //   fetchInGameOnlyFunds(4000),
  //   fetchInGameOnlyFunds(6000),
  //   fetchInGameOnlyFunds(8000)
  // ])

  // const result2 = await Promise.all([
  //   fetchInGameOnlyFunds(10000),
  //   fetchInGameOnlyFunds(12000),
  //   fetchInGameOnlyFunds(14000),
  //   fetchInGameOnlyFunds(16000),
  //   fetchInGameOnlyFunds(18000)
  // ])

  // const result3 = await Promise.all([
  //   fetchInGameOnlyFunds(20000),
  //   fetchInGameOnlyFunds(22000),
  //   fetchInGameOnlyFunds(24000),
  //   fetchInGameOnlyFunds(26000),
  //   fetchInGameOnlyFunds(28000)
  // ])

  // const result4 = await Promise.all([
  //   fetchInGameOnlyFunds(30000),
  //   fetchInGameOnlyFunds(32000),
  //   fetchInGameOnlyFunds(34000),
  //   fetchInGameOnlyFunds(36000),
  //   fetchInGameOnlyFunds(38000)
  // ])

  const elapsedMinutes = (Date.now() - startedTime) / 1000 / 60

  // console.log(
  //   'finished in',
  //   Math.floor(elapsedMinutes * 100) / 100,
  //   'minutes. Result #:',
  //   [...result, ...result2, ...result3, ...result4]
  //     .reduce((current, list) => current + list.length, 0)
  // )

  console.log(
    'finished in',
    Math.floor(elapsedMinutes * 100) / 100,
    'minutes. Result #:',
    result.reduce((current, list) => current + list.length, 0)
  )
}

run()
