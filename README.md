# Ledger Slack Bot

This is a Slack bot for [ledger-cli](http://ledger-cli.org). We use it
in conjunction with some of the ideas we've explored in
[rogeruiz/budget](https://github.com/rogeruiz/budget) repository the family
keeps.

## Usage

Run `npm start` and with everything configured right, you should see your
balances for **Assets** and **Liabilities:Credit** accounts and last month's
expenses for **Groceries** broken down by payee.

### Configuration

Copy over the `.env.example` file to `.env` and add values for the named
variables in there.
