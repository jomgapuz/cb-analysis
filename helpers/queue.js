const Queue = require('bull')

const queue = (name) => {
  return new Queue(name, process.env.REDIS_URL || 'redis://127.0.0.1:6379')
}
module.exports = {
  queue
}
