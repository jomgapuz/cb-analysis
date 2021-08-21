# CB Analysis Script

A script for https://github.com/CryptoBlades/cryptoblades/issues/640

## Setup

Create a `.env` file with the following:

- `HTTP_PROVIDER_URL` - a http url for bsc node
- `MONGDB_URL` - a ref to the mongodb instance

## Run

- `node . [args]`

## Args
- `--fight` (this runs fight history scraper)
- `--char` (this runs character scraper)
- `--weapon` (this runs weapon scraper)
- `--shield` (this runs shield scraper)
- `--char` (this runs cryptoblades erc20 transactions scraper)
- `--node=[http node url]` (sets the node url)
- `--start=[block]` (sets the starting block)