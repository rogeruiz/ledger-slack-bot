const debug = require( 'debug' )( 'get-money' )
const moment = require( 'moment' )
const Ledger = require( 'ledger-cli' ).Ledger
const l = new Ledger( { file: process.env.BUDGET_FILE } )

module.exports = {
  balance: function( done ) {
    var assets = {
      fallback: 'Total Assets',
      color: '#4de004',
      title: 'Total Assets',
      text: null,
      fields: [],
      footer: 'Cash',
      footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/dollar.png'
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
    l.balance().
      on( 'data', function ( entry ) {
        if ( entry.account.depth == 1 &&
             entry.account.fullname === 'Assets' ) {
          assets.fallback += ` ${ entry.total.formatted }`
          assets.text = entry.total.formatted
        }
        if ( entry.account.depth >= 2 &&
             /^Assets/.test( entry.account.fullname ) &&
             ! /^Assets:Funds$/.test( entry.account.fullname ) ) {
          assets.fields.push( {
            title: entry.account.shortname,
            value: entry.total.formatted,
            short: true,
          } )
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
        debug( `ledger#balance on 'end' with total Assets of ${ assets.fields.length } and total Liabilities of ${ liabilities.fields.length }`)
        done( [
          assets,
          liabilities,
        ] )
      } )
  },
  lastMonth: function ( tag ) {
    return new Promise( function ( resolve, reject ) {
      var category = {
        fallback: 'Expenses Last Month',
        color: '#5e27b2',
        title: `Last month's expenses matching ${ tag }` ,
        text: 'Grand total: $',
        fields: [],
        footer: 'Transactions',
        footer_icon: 'http://www.webpagefx.com/tools/emoji-cheat-sheet/graphics/emojis/money_with_wings.png'
      }
      var total = 0
      l.register().
        on( 'data', function ( entry ) {
          let lastMonth = moment().subtract( 30, 'days' )
          let past = moment( entry.date )
          if ( past.isSameOrAfter( lastMonth ) ) {
            let fields = entry.postings.map( function ( p/**, i, e*/ ) {
              if ( RegExp( tag ).test( p.account ) ) {
                total += p.commodity.amount
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
            category.fields.push( fields )
          }
        } ).
        once( 'end', function () {
          category.fields = [].concat.apply( [], category.fields )
          category.text += `${ total } :money_mouth_face:`
          debug( category )
          resolve( category )
        } ).
        once( 'error', function ( error ) {
          reject( error )
        } )
    } )
  },
}
