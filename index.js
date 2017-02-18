require( 'dotenv-safe' ).load()
const debug = require( 'debug' )( 'request' )
const dollars = require( './lib/get-money' )
const request = require( 'request' )
const url = 'https://slack.com/api/chat.postMessage'
var data = {
  token: process.env.SLACK_API_TOKEN,
  channel: process.env.SLACK_CHANNEL_ID,
  text: 'Updates from Ledger :bank: :money_with_wings:',
  as_user: true,
  pretty: 0,
}

dollars.balance( function ( message ) {
  data.attachments = JSON.stringify( message )
  request( { url: url, qs: data }, function ( error, response ) {
    if ( error ) {
      debug( error )
      process.exit( 99 )
    }
    debug( `API status: ${ response.statusCode }` )
    debug( `API response: ${ response.body }` )
    dollars.
      lastMonth( 'Groceries' ).
      then( function ( d ) {
        data.attachments = JSON.stringify( d )
        request( { url: url, qs: data }, function ( error, response ) {
          if ( error ) {
            debug( error )
            process.exit( 99 )
          }
          debug( `API status: ${ response.statusCode }` )
          debug( `API response: ${ response.body }` )
          process.exit( 0 )
        } )
      } ).
      catch( function ( error ) {
        debug( error )
        process.exit( 99 )
      } )
  } )
} )
