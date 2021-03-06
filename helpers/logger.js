const clc = require('cli-color')
const moment = require('moment-timezone')

const severityMap = {
  info: clc.cyan,
  warn: clc.yellow,
  error: clc.red,
  success: clc.green,
  main: clc.magenta
}

const logSender = {
  fight: 'Fight',
  char: 'Character',
  weapon: 'Weapon',
  shield: 'Shield',
  trans: 'Transaction',
  cron: 'Cron'
}

module.exports = (level, sender, type = null, msg) => {
  console.log(clc.blue(moment().tz('Asia/Manila').format('LTS')) + ' ' + severityMap[level](`[${logSender[sender].toUpperCase()}${(type ? ` ${type.toUpperCase()}` : '')}]`) + ' ' + clc.white.bold(msg))
}
