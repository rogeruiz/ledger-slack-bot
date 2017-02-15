require( 'dotenv-safe' ).load()
const RtmClient = require( '@slack/client' ).RtmClient
const RTM_CLIENT_EVENTS = require( '@slack/client' ).CLIENT_EVENTS.RTM
const token = process.env.SLACK_API_TOKEN
const channelId = process.env.SLACK_CHANNEL_ID
const rtm = new RtmClient( token, { logLevel: 'debug' } )

rtm.start()

rtm.on( RTM_CLIENT_EVENTS.RTM_CONNECTION_OPENED, function () {
  rtm.sendMessage( 'Buenos dias', channelId, function () {
    console.log( 'message sent, shutting down @el_capo' )
    process.exit( 0 )
  } )
} )
