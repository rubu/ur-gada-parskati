# General #

Javascript tooling that aggregated data from https://data.gov.lv/dati/lv/dataset/gada-parskatu-finansu-dati and generates different kinds of top lists per various metrics

# Usage #

Just run `node --max-old-space-size=4096 src/index.mjs`. The code is ugly, I was frustrated how dirty the data was, but it is something.

What is going to happen?
1) The script is going to download and place the needed data files (csv, xlsx, ...) in `data` folder
2) All the data files will be read and aggregated by registration numbers and year
3) Some random tops will be printed (feel free to comment that out)
4) a `dump_{yearRange}.csv` file with the data from `startYear` to `endYear` (configured in `src/index.mjs`) will be dumped inside the folder `dumps`

# Requirements #

- Node 18, since this project uses the built in fetch

# TODOs #

- Check sorting
- Dump all data as xls or something else (since the top functionality can be easily done in a spreadsheet once the data has been aggregated)
- Add better mapping of family doctors to business entities, currently this happens via name of the medical institution which maps less than half