const exec = require( 'child_process' ).exec;

module.exports = {
  balance: function( done ) {
    exec( '../balance \^Assets Credit \^Funds --strict', function ( error, stdout, stderr ) {
      if ( error ) {
        console.error( `exec error: ${error}` )
        return
      }
      done( `
      *Family Ledger* _Balance_ :money_with_wings: :bank:
      \`\`\`

${stdout}
      \`\`\`
      ` )
    } )
  }
}
