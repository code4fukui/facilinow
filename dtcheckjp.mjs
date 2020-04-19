import util from './util.mjs'

const fetchHoliday = async function() {
  const url_holiday = 'data/holiday_jp.csv'
  const holiday = await util.fetchCSVtoJSON(url_holiday)
  //console.log(holiday)
  return holiday
}

const parseMinutesJP = function(s) {
  s = util.toHalf(s)
  let num = s.match(/(午前|午後)(\d+)時(\d+)分/)
  if (num) {
    const h = parseInt(num[2]) + (num[1] == '午後' ? 12 : 0)
    const m = parseInt(num[3])
    return h * 60 + m
  }
  num = s.match(/(午前|午後)(\d+)時/)
  if (num) {
    const h = parseInt(num[2]) + (num[1] == '午後' ? 12 : 0)
    return h * 60
  }
  num = s.match(/(\d+)時/)
  if (num) {
    const h = parseInt(num[1])
    return h * 60
  }
  console.log('error parseMinutesJP ' + s)
  return 0
}
const getMinutesNow = function(t) {
  if (!t)
    t = new Date()
  return t.getHours() * 60 + t.getMinutes()
  //return 9 * 60 + 30
  //return 17 * 60 + 1
  //return 18 * 60 + 0
}
const checkTimeDuration = function(duration, nowt) {
  const s = duration.split('〜')
  const st = parseMinutesJP(s[0])
  const ed = parseMinutesJP(s[1])
  const now = getMinutesNow(nowt)
  return now >= st && now <= ed
}
/*
console.log(parseMinutesJP('午前９時30分'))
console.log(parseMinutesJP('午前10時'))
console.log(parseMinutesJP('午前時'))
*/
const parseDaysJP = function(s) {
  s = util.toHalf(s)
  let num = s.match(/(\d+)月(\d+)日/)
  if (num) {
    let m = parseInt(num[1])
    let d = parseInt(num[2])
    return m * 100 + d
  } 
  num = s.match(/(\d+)[\/／](\d+)/)
  if (num) {
    let m = parseInt(num[1])
    let d = parseInt(num[2])
    return m * 100 + d
  }
  console.log('error parseDaysJP ', s)
  //throw 'error ' + s
  return null
}
const getDaysNow = function(t) {
  if (!t)
    t = new Date()
  return (t.getMonth() + 1) * 100 + t.getDate()
  //return 921
  //return 1229
  //return 104 // 1/4
  //return 103 // 1/3
  //return 428
  //return 408
}
const checkDaysWithHoliday = function(holiday, rest, nowt) {
  if (!nowt)
    nowt = new Date()
  if (Array.isArray(rest)) {
    for (const r of rest) {
      if (checkDaysWithHoliday(holiday, r, nowt))
        return true
    }
    return false
  }
  if (rest.indexOf('、') >= 0) {
    return checkDaysWithHoliday(holiday, rest.split('、'), nowt)
  }
  if (!rest || rest.length == 0)
    return false

  const now = getDaysNow(nowt)
  rest = util.toHalf(rest)
  const d = new Date()
  d.setMonth(Math.floor(now / 100) - 1)
  d.setDate(now % 100)
  const day = d.getDay()
  const ymd = util.formatYMD(d)
  //console.log(rest, ymd)
  const WEEKS = '日月火水木金土'
  let m = rest.match(/^(毎週)?([日月火水木金土])曜日/)
  if (m) {
    const week = WEEKS.indexOf(m[2])
    //console.log('week', week, m[2], day, now)
    return week == day
  }
  const NUMS = '一二三四五12345'
  m = rest.match(/^第([一二三四五12345])・?第([一二三四五12345])([日月火水木金土])曜日/)
  if (m) {
    const week = WEEKS.indexOf(m[3])
    if (week != day)
      return false
    for (let i = 1; i <= 2; i++) {
      const nth = NUMS.indexOf(m[i]) % 5
      const date = d.getDate()
      //console.log(nth, date)
      if (Math.floor(date / 7) == nth)
        return true
    }
    return false
  }
  m = rest.match(/^第([一二三四五12345])([日月火水木金土])曜日/)
  if (m) {
    const week = WEEKS.indexOf(m[2])
    if (week != day)
      return false
    const nth = NUMS.indexOf(m[1]) % 5
    const date = d.getDate()
    //console.log(nth, date)
    return Math.floor(date / 7) == nth
  }
  if (rest == '祝日') {
    for (const h of holiday) {
      if (h.date == ymd)
        return true
    }
    return false
  }
  if (rest == '休日') {
    if (day == 0 || day == 6) // 土日
      return true
    for (const h of holiday) { // 祝日
      if (h.date == ymd)
        return true
    }
    return false
  }
  if (rest == '休日の翌日') {
    // まずその日が休日の場合は除く
    if (day == 0 || day == 6) // 土日
      return false
    for (const h of holiday) { // 祝日
      if (h.date == ymd)
        return false
    }
    // 翌日は休日は？
    const d2 = new Date(d.getTime() - (1000 * 60 * 60 * 24))
    const day2 = d2.getDay()
    const ymd2 = util.formatYMD(d2)
    if (day2 == 0 || day2 == 6) // 土日
      return true
    for (const h of holiday) { // 祝日
      if (h.date == ymd2)
        return true
    }
    return false
  }
  if (rest == '臨時休館日') {
    return false
  }
  if (rest.indexOf('〜') >= 0) {
    return checkDays(rest, nowt)
  }
  const pd = parseDaysJP(rest)
  if (pd != null) {
    return pd == now
  }
  console.log('error ', rest)
  //throw rest
  return false
}
const checkDays = function(during, nowt) {
  if (!nowt)
    nowt = new Date()
  const now = getDaysNow(nowt)
  const n = during.indexOf('〜')
  if (n < 0) {
    return parseDaysJP(during) == now
  }
  const s = during.split('〜')
  const st = parseDaysJP(s[0])
  const ed = parseDaysJP(s[1])
  if (st > ed) {
    return now >= st || now <= ed
  }
  return now >= st && now <= ed
}
class DateTimeChecker {
  checkTime(now, time) {
    return false
  }
  checkDate(now, date) {
    return false
  }
}
class DateTimeCheckerJP extends DateTimeChecker {
  async init() {
    this.holiday = await fetchHoliday()
    return this
  }
  checkTime(time, now) {
    return checkTimeDuration(time, now)
  }
  checkDate(date, now) {
    return checkDaysWithHoliday(this.holiday, date, now)
  }
}
class DateTimeCheckerJPlocal extends DateTimeCheckerJP {
  async init() {
    const fs = await import('fs')
    this.holiday = util.csv2json(util.decodeCSV(util.removeBOM(fs.readFileSync('data/holiday_jp.csv', 'utf-8'))))
    return this
  }
}

export default { DateTimeCheckerJP }

const main = async function() {
  const fs = await import('fs')
  const fn = 'data/fukui.csv'
  const data = util.csv2json(util.decodeCSV(util.removeBOM(fs.readFileSync(fn, 'utf-8'))))

  const dtcheck = await (new DateTimeCheckerJPlocal()).init()
  console.log(dtcheck.checkTime('8時〜9時'))
  console.log(dtcheck.checkDate('4月20日〜5月1日'))
  console.log(dtcheck.checkDate('祝日'))
  console.log(dtcheck.checkDate('祝日', new Date('2020-01-01')))
  console.log(dtcheck.checkDate('祝日、火曜日、4月20日'))
  console.log(dtcheck.checkDate('祝日、火曜日、4／20'))
  console.log(dtcheck.checkDate('祝日、火曜日、4/20'))
}
if (globalThis.process && process.argv[1].endsWith('/dtcheckjp.mjs')) {
  main()
}

