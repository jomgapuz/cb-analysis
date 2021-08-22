const mongoose = require('mongoose')
const path = require('path')

require('./services/bsc-nodes-services')

require('dotenv').config()

let connectionString = process.env.MONGDB_URL
if (process.env.MONGODB_SSL) connectionString += `&tls=true&tlsCAFile=${path.join(__dirname, 'cert.crt')}`
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}, (err) => {
  if (err) {
    console.log(err)
    process.exit(0)
  }

  console.log('🌿 Connected to MongoDB')

  process.argv.forEach((val) => {
    if (val.startsWith('--node')) process.env.HTTP_PROVIDER_URL = val.split('=')[1]
    if (val.startsWith('--fight')) require('./tasks/fights')
    if (val.startsWith('--char')) require('./tasks/characters')
    if (val.startsWith('--weapon')) require('./tasks/weapons')
    if (val.startsWith('--shield')) require('./tasks/shields')
    if (val.startsWith('--trans')) require('./tasks/transactions')
    if (val.startsWith('--cron')) require('./tasks/cron')
    if (val.startsWith('--proc')) {
      const type = val.split('=')[1].toString().trim()
      switch (type) {
        case 'fight': require('./processors/fights'); break
        case 'char': require('./processors/characters'); break
        case 'weapon': require('./processors/weapons'); break
        case 'shield': require('./processors/shields'); break
        case 'trans': require('./processors/transactions'); break
        default: break
      }
    }
  })
})
module.exports = mongoose
