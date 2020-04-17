import util from './util.mjs'

const makeHoliday = function(json) {
  const res = []
  for (const d of json) {
    res.push({
      date: util.formatYMD(new Date(d['国民の祝日・休日月日'])),
      name: d['国民の祝日・休日名称']
    })
  }
  return res
}

const list = [
//  { fn: 'data/fukui.csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSUWpavqGBtbmJ4VB9gxzVe1GtE-Q5YpJtL49xC72W2viSp4DTZys1lSXUqye7I9uXhpojFH3BdDKIT/pub?gid=0&single=true&output=csv' },
  { fn: 'data/holiday_jp.csv', url: 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv', url_src: 'https://www.data.go.jp/data/dataset/cao_20190522_0002', filter: makeHoliday },
]

const main = async function() {
  for (const item of list) {
    let data = await util.fetchCSVtoJSON(item.url)
    console.log(data)
    if (item.filter)
      data = item.filter(data)
    util.writeCSVfromJSON(item.fn, data)
  }
}
main()
