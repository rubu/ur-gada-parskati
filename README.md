# General #

Javascript tooling that aggregated data from https://data.gov.lv/dati/lv/dataset/gada-parskatu-finansu-dati and generates different kinds of top lists per various metrics

# Usage #

Just run `node src/index.js`. The code is ugly, I was frustrated how dirty the data was, but it is something.

What is going to happen?
1) The script is going to download and place the needed csv files in `data` folder
2) All the csv files will be read and aggregated by registration numbers and year
3) Some random tops will be printed (feel free to comment that out)
4) a `dump.csv` file with the data from `startYear` to `endYear` will be dumped

# Requirements #

- Node 18, since this project uses the built in fetch

# TODOs #

- Download the needed input csv files if not present or stale
- Check sorting
- Dump all data as xls or something else (since the top functionality can be easily done in a spreadsheet once the data has been aggregated)
- Understand how to group the data (NACE classification is not available?)