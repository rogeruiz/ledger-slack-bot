const debug = require( 'debug' )( 'get-money' )
const moment = require( 'moment' )
const money = require( 'money-math' )
const Ledger = require( 'ledger-cli' ).Ledger
const l = new Ledger( { file: process.env.BUDGET_FILE } )

module.exports = {
  balance: function( done ) {
    var cashAssets = {
      fallback: 'Total assets for Cash',
      color: '#4de004',
      title: 'Total assets for Cash',
      text: null,
      fields: [],
      footer: 'Cash',
      footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/dollar.png'
    }
    var fundsAssets = {
      fallback: 'Total assets for Funds',
      color: '#044de0',
      title: 'Total assets for Funds',
      text: null,
      fields: [],
      footer: 'Funds',
      footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/moneybag.png'
    }
    var jackieAssets = {
      fallback: 'Total assets for Jackie',
      color: '#fcd28a',
      title: 'Total assets for Jackie',
      text: null,
      fields: [],
      footer: 'Jackie',
      footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/bank.png'
    }
    var liabilities = {
      fallback: 'Total Liabilities',
      color: '#dd3125',
      title: 'Total Liabilities',
      text: null,
      fields: [],
      footer: 'Credit',
      footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/credit_card.png'
    }
    var cashTotals = []
    l.balance().
      on( 'data', function ( entry ) {
        if ( entry.account.depth >= 2 &&
             /^Assets/.test( entry.account.fullname ) ) {
          if ( /^Assets:Checking/.test( entry.account.fullname ) ||
               /^Assets:Savings.+/.test( entry.account.fullname ) ) {
            cashAssets.fields.push( {
              title: entry.account.fullname.replace( 'Assets:', '' ),
              value: entry.total.formatted,
              short: true,
            } )
          }
          if ( entry.account.fullname === 'Assets:Checking' ||
               entry.account.fullname === 'Assets:Savings' ) {
            cashTotals.push( money.floatToAmount( entry.total.amount ) )
          }
          if ( /^Assets:Jackie.+/.test( entry.account.fullname ) ) {
            jackieAssets.fields.push( {
              title: entry.account.shortname,
              value: entry.total.formatted,
              short: true,
            } )
          }
          if ( entry.account.fullname === 'Assets:Jackie' ) {
            jackieAssets.fallback += ` ${ entry.total.formatted }`
            jackieAssets.text = entry.total.formatted
          }
          if ( /^Assets:Funds.+/.test( entry.account.fullname ) ) {
            fundsAssets.fields.push( {
              title: entry.account.shortname,
              value: entry.total.formatted,
              short: true,
            } )
          }
          if ( entry.account.fullname === 'Assets:Funds' ) {
            fundsAssets.fallback += ` ${ entry.total.formatted }`
            fundsAssets.text = entry.total.formatted
          }
        }
        if ( entry.account.depth == 2 &&
             entry.account.fullname === 'Liabilities:Credit' ) {
          liabilities.fallback += ` ${ entry.total.formatted }`
          liabilities.text = entry.total.formatted
        }
        if ( entry.account.depth >= 3 && /^Liabilities:Credit/.test( entry.account.fullname ) ) {
          liabilities.fields.push( {
            title: entry.account.shortname,
            value: entry.total.formatted,
            short: true,
          } )
        }
      } ).
      once( 'end', function () {
        debug( cashAssets )
        debug( fundsAssets )
        debug( jackieAssets )
        debug( liabilities )
        let cashTotal = cashTotals.reduce( money.add )
        cashAssets.fallback += ` \$${ cashTotal }`
        cashAssets.text = `\$${ cashTotal }`
        done( [
          cashAssets,
          fundsAssets,
          jackieAssets,
          liabilities,
        ] )
      } )
  },
  lastMonth: function ( tag ) {
    return new Promise( function ( resolve, reject ) {
      var categories = {
        fallback: 'Expenses Last Month',
        color: '#5e27b2',
        title: `Last month's expenses matching ${ tag }` ,
        text: 'Grand total: $',
        fields: [],
        footer: 'Transactions',
        footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/money_with_wings.png'
      }
      var totals = []
      l.register().
        on( 'data', function ( entry ) {
          let lastMonth = moment().subtract( 30, 'days' )
          let past = moment( entry.date )
          if ( past.isSameOrAfter( lastMonth ) ) {
            let fields = entry.postings.map( function ( p/**, i, e*/ ) {
              if ( RegExp( tag ).test( p.account ) ) {
                totals.push( money.floatToAmount( p.commodity.amount ) )
                return {
                  title: `${ entry.payee } from ${ moment( past ).fromNow() }`,
                  value: p.commodity.formatted,
                  short: true,
                }
              }
              return false
            } ).
              filter( function ( p ) {
                return p !== false
              } )
            categories.fields.push( fields )
          }
        } ).
        once( 'end', function () {
          categories.fields = [].concat.apply( [], categories.fields )
          let total = totals.reduce( money.add )
          categories.text += `${ total } :money_mouth_face:`
          debug( categories )
          resolve( [ categories ] )
        } ).
        once( 'error', function ( error ) {
          reject( error )
        } )
    } )
  },
  medical: function () {
    let ll = new Ledger( { file: '/Users/rsr/Documents/Budgets/medical.ledger' } )
    return new Promise( function ( resolve, reject ) {
      var title = {
        fallback: 'Medical debt so far',
        color: '#fffff',
        title: 'The business of getting sick.' ,
        text: [],
        footer: 'Medical',
        footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/hospital.png'
      }
      let affordable = {
        fallback: 'Affordable medical debt',
        color: '#f4f41f',
        title: 'We could pay this stuff off.',
        text: [],
        fields: [],
        footer: 'Affordable',
        footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/money_with_wings.png'
      }
      let expensive = {
        fallback: 'Expensive medical debt',
        color: '#ed9f0e',
        title: 'We could tackle some of these instead of having nice things.',
        text: [],
        fields: [],
        footer: 'Expensive',
        footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/dollar.png'
      }
      let greed = {
        fallback: 'Greedy medical debt',
        color: '#ef0b35',
        title: 'The only way to pay this stuff off is to really plan it or get lucky.',
        text: [],
        fields: [],
        footer: 'Greed',
        footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/moneybag.png'
      }
      ll.register().
        on( 'data', function ( entry ) {
          let past = moment( entry.date )
          entry.postings.forEach( function ( p ) {
            if ( RegExp( 'Liabilities:Medical' ).test( p.account ) ) {
              title.text.push( money.floatToAmount( p.commodity.amount ) )
              if ( p.commodity.amount <= 50 ) {
                affordable.text.push( money.floatToAmount( p.commodity.amount ) )
                affordable.fields.push( {
                  title: `${ entry.payee } last contacted ${ moment( past ).fromNow() }`,
                  value: p.commodity.formatted,
                  short: true,
                } )
              } else if ( p.commodity.amount <= 100 ) {
                expensive.text.push( money.floatToAmount( p.commodity.amount ) )
                expensive.fields.push( {
                  title: `${ entry.payee } last contacted ${ moment( past ).fromNow() }`,
                  value: p.commodity.formatted,
                  short: true,
                } )
              } else if ( p.commodity.amount > 100 ) {
                greed.text.push( money.floatToAmount( p.commodity.amount ) )
                greed.fields.push( {
                  title: `${ entry.payee } last contacted ${ moment( past ).fromNow() }`,
                  value: p.commodity.formatted,
                  short: true,
                } )
              }
            }
          } )
        } ).
        once( 'end', function () {
          affordable.fields = [].concat.apply( [], affordable.fields )
          expensive.fields = [].concat.apply( [], expensive.fields )
          greed.fields = [].concat.apply( [], greed.fields )
          title.text = `Grand total: \$${ title.text.reduce( money.add ) } :face_with_thermometer:`
          affordable.text = `Grand total: \$${ affordable.text.reduce( money.add ) } :face_with_thermometer:`
          expensive.text = `Grand total: \$${ expensive.text.reduce( money.add ) } :face_with_thermometer:`
          greed.text = `Grand total: \$${ greed.text.reduce( money.add ) } :face_with_thermometer:`
          resolve( [ title, affordable, expensive, greed ] )
        } ).
        once( 'error', function ( error ) {
          reject( error )
        } )
    } )
  },
}
