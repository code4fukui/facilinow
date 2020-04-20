import util from './util.mjs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import fs from 'fs'

const parseTableItems = function(dom, tbl) {
  const item = {}
  dom('tr', null, tbl).each((idx, ele) => {
    const td = dom('td', null, ele)
    item[dom(td[0]).text().trim()] = dom(td[1]).text().trim()
  })
  return item
}

const getLatLngFromGoogleMaps = async function(urlgmap) {
  const res = await fetch(urlgmap)
  //console.log(res)
  // console.log(res.headers) // 有益情報なし
  const url = res.url
  const ll = url.match(/@(\d+\.\d+),(\d+\.\d+)/)
  if (ll)
    return { lat: ll[1], lng: ll[2] }
  const text = await res.text()
  console.log(text)
  
  //const text = `KY 近岡店",[36.6097831,136.63204],"10461129635172263920"],"GENKY 近岡店"`
  let num = text.match(/\,\[(\d+)\.(\d+)\,(\d+)\.(\d+)\]/) // ,[36.6097831,136.63204],
  if (num) {
    const lat = num[1] + "." + num[2]
    const lng = num[3] + "." + num[4]
    const res = { lat, lng }
    // console.log(res)
    return res
  }
  num = text.match(/\,\"\+(\d+)\.(\d+)\+(\d+)\.(\d+)\"/) // ,"+36.654639+136.719583"
  if (num) {
    const lat = num[1] + "." + num[2]
    const lng = num[3] + "." + num[4]
    const res = { lat, lng }
    // console.log(res)
    return res
  }
  return null
}

const parseLatLng = async function(gmapurl) {
  return await getLatLngFromGoogleMaps(gmapurl)
  /* // 表示場所なので、使えない
  const ss = gmapurl.split('!')
  const lat = ss.filter(s => s.startsWith('2d'))[0].substring(2)
  const lng = ss.filter(s => s.startsWith('3d'))[0].substring(2)
  console.log(lat, lng)
  */

}
const parsePostalCodeAndAddress = function(s) {
  if (!s)
    return null
  s = util.toHalf(s)
  s = s.replace(/\s/g, "")
  let m = s.match(/〒(\d+)[-−](\d+)(.+)/)
  if (m) {
    return [ m[1] + "-" + m[2], m[3] ]
  }
  m = s.match(/〒(\d+)(.+)/)
  if (m) {
    return [ m[1].substring(0, 3) + "-" + m[1].substring(3), m[2] ]
  }
  return [ '', s ]
}
const convertURL = function(url) {
  return 'data/' + url.replace(/[:\/\?\&\!\=\.]/g, "_")
}
const saveHTML = function(url, html) {
  fs.writeFileSync(convertURL(url), html, "utf-8")
}
const SLEEP_BEFORE_FETCH = 3000
const fetchHTML = async function(url) {
  const fn = convertURL(url)
  try {
    const html = fs.readFileSync(fn)
    console.log('use cache ', url)
    return html
  } catch (e) {
    console.log('fetching... ', url)
    await util.sleep(3000)
    const html = await (await fetch(url)).text()
    saveHTML(url, html)
    return html
  }
}
const fetchShop = async function(url) {
  const html = await fetchHTML(url)
  const dom = cheerio.load(html)
  const item = parseTableItems(dom, dom('.ShopGaiyoBox table')[0])
  const pa = parsePostalCodeAndAddress(item['所在地'])
  item['店舗名'] = dom(dom('#Stores-ShousaiBox h1')[0]).text().trim()
  item['郵便番号'] = pa[0]
  item['所在地'] = pa[1]
  item['定休日'] = util.toHalf(item['定休日'])
  item.TEL = util.toHalf(item.TEL)
  item['営業時間'] = util.toHalf(item['営業時間'])
  const gmapurl = dom(dom('.ShopMap iframe')[0]).attr('src')
  const ll = await getLatLngFromGoogleMaps(gmapurl)
  //item.gmap = gmapurl
  if (ll) {
    item['緯度']= ll.lat
    item['経度'] = ll.lng
  }
  console.log(item)
  return item
}
const test = async function() {
  //parseLatLng('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3202.6894670946276!2d136.62985131516524!3d36.609787386094965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5ff9cce1d789d491%3A0x912d65fa4dc127f0!2zR0VOS1kg6L-R5bKh5bqX!5e0!3m2!1sja!2sjp!4v1574387801035!5m2!1sja!2sjp')
  //console.log(await parseLatLng('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3200.8257166670355!2d136.71739461516645!3d36.65464318357958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDM5JzE2LjciTiAxMzbCsDQzJzEwLjUiRQ!5e0!3m2!1sja!2sjp!4v1574409622424!5m2!1sja!2sjp'))
  //console.log(await parseLatLng('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3225.1646453668413!2d136.1829682151516!3d36.06508801643169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5ff8bf263aa921b5%3A0xc76af02289bef326!2z44CSOTE4LTgwNjcg56aP5LqV55yM56aP5LqV5biC6aOv5aGa55S677yY4oiS77yR77yR77yYIOOCsuODs-OCreODvOmjr-WhmuW6lw!5e0!3m2!1sja!2sjp!4v1574391199879!5m2!1sja!2sjp'))
  //await fetchShop('http://www.genky.co.jp/shop/cont.php?cont_no=106&g=1&ar=&page=0')
  //console.log(parsePostalCodeAndAddress('〒912−0045福井県大野市若杉町216番'))
  //console.log(parsePostalCodeAndAddress('〒9101212福井県吉田郡永平寺町東古市15-34-1'))
  //return
}
const scrape = async function() {
  const baseurl = 'http://www.genky.co.jp/shop/list.php'
  const fn = 'genkey4.csv'
  const list = []
  A: for (let i = 1; i <= 4; i++) {
    for (let j = 0;; j++) {
      const url = baseurl + "?g=" + i + "&page=" + j
      const html = await fetchHTML(url)
      const dom = cheerio.load(html)
      //console.log(html)
      const links = []
      dom('.ShopListBox a').each(async (idx, ele) => {
        const shopurl = 'http://www.genky.co.jp/shop/' + dom(ele).attr('href')
        if (links.indexOf(shopurl) == -1) {
          links.push(shopurl)
        }
      })
      for (const link of links) {
        const item = await fetchShop(link)
        list.push(item)
        item.IDg = i
        item.cont_no = parseInt(link.match(/cont_no=(\d+)/)[1])
        item.URL = link
      }
      util.writeCSVfromJSON(fn, list)
      if (links.length == 0)
        break
    }
  }
  checkList(list)
}
const convert = async function() {
  const fn = 'genkey1.csv'
  const fndst = 'genkey2.csv'
  const list = util.readJSONfromCSV(fn)
  console.log(list)
  for (const item of list) {
    item['定休日'] = util.toHalf(item['定休日'])
    item['営業時間'] = util.toHalf(item['営業時間'])
    item.TEL = util.toHalf(item.TEL)
    if (!item['郵便番号']) {
      const pa = parsePostalCodeAndAddress(item['所在地'])
      item['郵便番号'] = pa[0]
      item['所在地'] = pa[1]
    }
    if (!item['緯度']) {
      const ll = await parseLatLng(item.gmap)
      util.sleep(1000)
      item['緯度'] = ll.lat
      item['経度'] = ll.lng
    }
    delete item.gmap
  }
  util.writeCSVfromJSON(fndst, list)
}
const unique = ar => ar.filter((cur, idx, self) => self.indexOf(cur) == idx)

const checkList = function(list2) {
  console.log('店舗数', list2.length)
  const pref = unique(list2.map(i => i['所在地'].substring(0, 3)))
  //console.log(pref)
  for (const p of pref) {
    console.log(p, list2.reduce((acc, cur) => acc + (cur['所在地'].startsWith(p) ? 1 : 0), 0))
  }
}
const convert2 = async function() {
  const fn = 'genkey2.csv'
  const fndst = 'genkey3.csv'
  const list = util.readJSONfromCSV(fn)
  console.log(list)
  const list2 = []
  for (const item of list) {
    if (list2.some(x => x.cont_no == item.cont_no))
      continue
    item.URL = `http://www.genky.co.jp/shop/cont.php?cont_no=${item.cont_no}&g=${item.IDg}&ar=&page=0`
    list2.push(item)
  }
  util.writeCSVfromJSON(fndst, list2)
  checkList(list2)
}
const renames = function() {
  for (const f of fs.readdirSync('data')) {
    if (f.startsWith('data_')) {
      const f2 = f.substring(5)
      fs.writeFileSync('data/' + f2, fs.readFileSync('data/' + f, 'utf-8'))
      fs.unlinkSync('data/' + f)
      console.log(f)
    }
  }
}
const check = function() {
  const list = util.readJSONfromCSV('genkey4.csv')
  checkList(list)
}
const main = async function() {
  await scrape()
  //check()

  //saveHTML('http://www.genky.co.jp/shop/cont.php?cont_no=106&g=1&ar=&page=0', 'test')
  //await convert2()

}
main()
