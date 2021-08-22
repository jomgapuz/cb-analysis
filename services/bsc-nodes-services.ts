import Web3 from "web3";

const MaxRequestsPerNode = 10000;
const MaxDurationOfMaxRequestsPerNodeInMinutes = 5;

/**
 *
 * @param millisFromEpoch Recommended values that came from `Date.now()`.
 */
const hasNumberOfMinutesPast = (
  millisFromEpoch: number,
  numberOfMinutes: number
) => {
  const elapsedMinutes = (Date.now() - millisFromEpoch) / 1000 / 60;
  return elapsedMinutes > numberOfMinutes;
};

export const BscNodeUrls = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://bsc-dataseed1.ninicoin.io/",
  "https://bsc-dataseed2.defibit.io/",
  "https://bsc-dataseed3.defibit.io/",
  "https://bsc-dataseed4.defibit.io/",
  "https://bsc-dataseed2.ninicoin.io/",
  "https://bsc-dataseed3.ninicoin.io/",
  "https://bsc-dataseed4.ninicoin.io/",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
] as const;

const logRateLimit = async (url: string, intervalInSeconds: number) => {
  console.log(
    url,
    "rate limit reached >> retrying getting web3Service in >>",
    intervalInSeconds,
    "seconds"
  );
};

export const BscNodeServices = BscNodeUrls.map((url) => {
  const web3Service = new Web3(url);

  let firstRequestAtMillis = Date.now();

  let numberOfRequests = 0;

  const canRequest = () => {
    if (numberOfRequests < MaxRequestsPerNode) {
      numberOfRequests += 1;

      return true;
    }

    if (
      hasNumberOfMinutesPast(
        firstRequestAtMillis,
        MaxDurationOfMaxRequestsPerNodeInMinutes
      )
    ) {
      firstRequestAtMillis = Date.now();
      numberOfRequests = 1;

      return true;
    }

    return false;
  };

  const getService = (intervalInSeconds = 15) =>
    new Promise((resolve: (theWeb3Service: Web3) => void) => {
      if (canRequest()) {
        resolve(web3Service);

        return;
      }

      logRateLimit(url, intervalInSeconds);

      const interval = setInterval(() => {
        if (canRequest()) {
          clearInterval(interval);
          resolve(web3Service);

          return;
        }

        logRateLimit(url, intervalInSeconds);
      }, 1000 * intervalInSeconds);
    });

  return {
    firstRequestAtMillis: Date.now(),
    run: async <T>(
      callback: (web3Service: Web3) => T,
      intervalInSeconds = 15
    ) => {
      const theWeb3Service = await getService(intervalInSeconds);

      return callback(theWeb3Service);
    },
  };
});

let nodeIndex = 0;

/**
 * Use this to load balance through BSC nodes with Rate Limiting. Only
 * do one (1) `Web3` node request per callback.
 */
export const runWeb3 = async <T>(
  callback: (web3: Web3) => T,
  intervalInSeconds = 15
) => {
  const currentIndex = nodeIndex;

  nodeIndex = (nodeIndex + 1) % BscNodeServices.length;

  return BscNodeServices[currentIndex].run(callback, intervalInSeconds);
};

console.log(
  `
NOTE: import { runWeb3 } from "services/bsc-node-services"; You can do node
requests safely. It load balances through`,
  BscNodeUrls.length,
  `BSC nodes.

You can do`,
  MaxRequestsPerNode,
  "req *",
  BscNodeUrls.length,
  "nodes =",
  MaxRequestsPerNode * BscNodeUrls.length,
  "requests in",
  MaxDurationOfMaxRequestsPerNodeInMinutes,
  `minutes.
`
);
