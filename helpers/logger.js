const clc = require('cli-color')
const moment = require('moment')

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
  trans: 'Transaction'
}

module.exports = (level, sender, type, msg) => {
  console.log(clc.blue(moment().format('LTS')) + ' ' + severityMap[level](`[${logSender[sender]} ${type.toUpperCase()}]`) + ' ' + clc.white.bold(msg))
}
