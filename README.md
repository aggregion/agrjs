# Agrjs

General purpose library for Aggregion blockchain.


### Installation

* Install with: `npm install agrjs`

### Usage

Ways to instantiate eosjs.

```js
const Agr = require('agrjs')

// Private key or keys (array) provided statically or by way of a function.
// For multiple keys, the get_required_keys API is used (more on that below).
keyProvider: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'

// Localhost Testnet (run ./docker/up.sh)
const agr = new Agr({keyProvider})

// Connect to a testnet or mainnet
const agr = new Agr({httpEndpoint, chainId, keyProvider})

// Cold-storage
const agr = new Agr({httpEndpoint: null, chainId, keyProvider})

// Read-only instance when 'eosjs' is already a dependency
const agr = new Agr.modules.api({/*config*/})

```

No-arguments prints usage.

```js
agr.getBlock()
```
```json
USAGE
getBlock - Fetch a block from the blockchain.

PARAMETERS
{
  "block_num_or_id": "string"
}
```


All blockchain functions (read and write) follow this pattern:

```js
// If the last argument is a function it is treated as a callback
agr.getBlock(1, (error, result) => {})

// If a callback is not provided, a Promise is returned
agr.getBlock(1) // @returns {Promise}

// Parameters can be positional or an object
agr.getBlock({block_num_or_id: 1})

// An API with no parameters is invoked with an empty object or callback (avoids logging usage)
agr.getInfo({}) // @returns {Promise}
agr.getInfo((error, result) => { console.log(error, result) })
```


### Configuration

```js
const Agr = require('agrjs')

// Default configuration
const config = {
  chainId: null, // 32 byte (64 char) hex string
  keyProvider: ['PrivateKeys...'], // WIF string or array of keys..
  httpEndpoint: 'http://127.0.0.1:8888',
  expireInSeconds: 60,
  broadcast: true,
  verbose: false, // API activity
  sign: true
};

const agr = new Agr(config);
```

* **chainId** `hex` - Unique ID for the blockchain you're connecting to.  This
  is required for valid transaction signing.  The chainId is provided via the
  [get_info](http://ayeaye.cypherglass.com:8888/v1/chain/get_info) API call.

  Identifies a chain by its initial genesis block.  All transactions signed will
  only be valid the blockchain with this chainId.  Verify the chainId for
  security reasons.

* **keyProvider** `[array<string>|string|function]` - Provides private keys
  used to sign transaction.  If multiple private keys are found, the API
  `get_required_keys` is called to discover which signing keys to use.  If a
  function is provided, this function is called for each transaction.

* **httpEndpoint** `string` - http or https location of a agrnode server
  providing a chain API.  When using agrjs from a browser remember to configure
  the same origin policy in agrnode or proxy server.  For testing, nodeosd
  configuration `access-control-allow-origin = *` could be used.

  Set this value to **null** for a cold-storage (no network) configuration.

* **expireInSeconds** `number` - number of seconds before the transaction
  will expire.  The time is based on the agrnode's clock.  An unexpired
  transaction that may have had an error is a liability until the expiration
  is reached, this time should be brief.

* **broadcast** `[boolean=true]` - post the transaction to
  the blockchain.  Use false to obtain a fully signed transaction.

* **verbose** `[boolean=false]` - verbose logging such as API activity.

* **debug** `[boolean=false]` - low level debug logging (serialization).

* **sign** `[boolean=true]` - sign the transaction with a private key.  Leaving
  a transaction unsigned avoids the need to provide a private key.

* **mockTransactions** (advanced)
  * `mockTransactions: () => null // 'pass',  or 'fail'`
  * `pass` - do not broadcast, always pretend that the transaction worked
  * `fail` - do not broadcast, pretend the transaction failed
  * `null|undefined` - broadcast as usual

* **transactionHeaders** (advanced) - manually calculate transaction header.  This
  may be provided so agrjs does not need to make header related API calls to
  agrnode.  Used in environments like cold-storage.  This callback is called for
  every transaction. 
  * `transactionHeaders: (expireInSeconds, callback) => {callback(null/*error*/, headers)}`

* **logger** - default logging configuration.
  ```js
  logger: {
    log: config.verbose ? console.log : null,  // null to disable
    error: config.verbose ? console.error : null,
  }
  ```

  For example, redirect error logs: `config.logger = {error: (...args) => ..}`

### Options

Options may be provided after parameters.

NOTE: `authorization` is for individual actions, it does not belong in `Eos(config)`.

```js
options = {
  authorization: 'alice@active',
  broadcast: true,
  sign: true
}
```

```js
eos.transfer('alice', 'bob', '1.0000 AGR', '', options)
```

* **authorization** `[array<auth>|auth]` - identifies the
  signing account and permission typically in a multisig
  configuration.  Authorization may be a string formatted as
  `account@permission` or an `object<{actor: account, permission}>`.
  * If missing default authorizations will be calculated.
  * If provided additional authorizations will not be added.
  * Performs deterministic sorting by account name

  If a default authorization is calculated the action's 1st field must be
  an account_name.  The account_name in the 1st field gets added as the
  active key authorization for the action.

* **broadcast** `[boolean=true]` - post the transaction to
  the blockchain.  Use false to obtain a fully signed transaction.

* **sign** `[boolean=true]` - sign the transaction with a private key.  Leaving
  a transaction unsigned avoids the need to provide a private key.

### Transaction

The transaction function accepts the standard blockchain transaction.

Required transaction header fields will be added unless you are signing without a
network connection (httpEndpoint == null). In that case provide you own headers:

```js
// only needed in cold-storage or for offline transactions
const headers = {
  expiration: '2018-06-14T18:16:10'
  ref_block_num: 1,
  ref_block_prefix: 452435776
}
```

Create and send (broadcast) a transaction:

```javascript
/** @return {Promise} */
agr.transaction(
  {
    // ...headers,
    actions: [
      {
        account: 'agrio.token',
        name: 'transfer',
        authorization: [{
          actor: 'inita',
          permission: 'active'
        }],
        data: {
          from: 'inita',
          to: 'initb',
          quantity: '7.0000 AGR',
          memo: ''
        }
      }
    ]
  }
  // config -- example: {broadcast: false, sign: true}
)
```

### Named action functions

More concise functions are provided for applications that may use actions
more frequently.  This avoids having lots of JSON in the code.

```javascript
// Run with no arguments to print usage.
agr.transfer()

// Callback is last, when omitted a promise is returned
agr.transfer('inita', 'initb', '1.0000 AGR', '', (error, result) => {})
agr.transfer('inita', 'initb', '1.1000 AGR', '') // @returns {Promise}

// positional parameters
agr.transfer('inita', 'initb', '1.2000 AGR', '')

// named parameters
agr.transfer({from: 'inita', to: 'initb', quantity: '1.3000 AGR', memo: ''})

// options appear after parameters
options = {broadcast: true, sign: true}

// `false` is a shortcut for {broadcast: false}
agr.transfer('inita', 'initb', '1.4000 AGR', '', false)
```

```js
DecimalPad = Agr.modules.format.DecimalPad
userInput = '10.2'
precision = 4
assert.equal('10.2000', DecimalPad(userInput, precision))
```


### Shorthand

Shorthand is available for some types such as Asset and Authority.  This syntax
is only for concise functions and does not work when providing entire transaction
objects to `agr.transaction`..

For example:
* permission `inita` defaults `inita@active`
* authority `'AGR6MRy..'` expands `{threshold: 1, keys: [{key: 'AGR6MRy..', weight: 1}]}`
* authority `inita` expands `{threshold: 1, accounts: [{permission: {actor: 'inita', permission: 'active'}, weight: 1}]}`

### New Account

New accounts will likely require some staked tokens for RAM and bandwidth.

```javascript
wif = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
pubkey = 'AGR6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'

agr.transaction(tr => {
  tr.newaccount({
    creator: 'agrio',
    name: 'myaccount',
    owner: pubkey,
    active: pubkey
  })

  tr.buyrambytes({
    payer: 'agrio',
    receiver: 'myaccount',
    bytes: 8192
  })

  tr.delegatebw({
    from: 'agrio',
    receiver: 'myaccount',
    stake_net_quantity: '10.0000 AGR',
    stake_cpu_quantity: '10.0000 AGR',
    transfer: 0
  })
})
```

### Contract

Deploy and call smart contracts.

#### Compile

If you're loading a **wasm** file, you do not need binaryen. If you're loading
a **wast** file you can include and configure the binaryen compiler, this is
used to compile to **wasm** automatically when calling **setcode**.


```bash
$ npm install binaryen@37.0.0
```

```js
binaryen = require('binaryen')
const agr = new Agr({keyProvider, binaryen})
```

#### Deploy

```javascript
const wasm = fs.readFileSync(`docker/contracts/agrio.token/agrio.token.wasm`);
const abi = fs.readFileSync(`docker/contracts/agrio.token/agrio.token.abi`);

// Publish contract to the blockchain
agr.setcode('myaccount', 0, 0, wasm) // @returns {Promise}
agr.setabi('myaccount', JSON.parse(abi)) // @returns {Promise}
```

#### Fetch a smart contract

```js
// @returns {Promise}
agr.contract('myaccount', [options], [callback])

// Run immediately, `myaction` returns a Promise
agr.contract('myaccount').then(myaccount => myaccount.myaction(..))

// Group actions. `transaction` returns a Promise but `myaction` does not
agr.transaction('myaccount', myaccount => { myaccount.myaction(..) })

// Transaction with multiple contracts
agr.transaction(['myaccount', 'myaccount2'], ({myaccount, myaccount2}) => {
   myaccount.myaction(..)
   myaccount2.myaction(..)
})
```

#### Offline or cold-storage contract

```js
const agr = new Agr({httpEndpoint: null})

const abi = fs.readFileSync(`docker/contracts/agrio.token/agrio.token.abi`)
agr.fc.abiCache.abi('myaccount', JSON.parse(abi))

// Check that the ABI is available (print usage)
agr.contract('myaccount').then(myaccount => myaccount.create())
```
#### Offline or cold-storage transaction

```js
// ONLINE

// Prepare headers
expireInSeconds = 60 * 60 // 1 hour

const agrio = new Agr(/* {httpEndpoint: 'https://..'} */)

const info = await agr.getInfo({})
const chainDate = new Date(info.head_block_time + 'Z')
let expiration = new Date(chainDate.getTime() + expireInSeconds * 1000)
expiration = expiration.toISOString().split('.')[0]

const block = await agr.getBlock(info.last_irreversible_block_num)

transactionHeaders = {
  expiration,
  ref_block_num: info.last_irreversible_block_num & 0xFFFF,
  ref_block_prefix: block.ref_block_prefix
}

// OFFLINE (bring `transactionHeaders`)

// All keys in keyProvider will sign.
const agr = new Agr({httpEndpoint: null, chainId, keyProvider, transactionHeaders})

transfer = await agr.transfer('inita', 'initb', '1.0000 AGR', '')
transferTransaction = transfer.transaction

// ONLINE (bring `transferTransaction`)

const agr = new Agr(/* {httpEndpoint: 'https://..'} */)

processedTransaction = await agr.pushTransaction(transferTransaction)
```

#### Custom Token

```js
// more on the contract / transaction syntax

await agr.transaction('myaccount', myaccount => {

  // Create the initial token with its max supply
  // const options = {authorization: 'myaccount'} // default
  myaccount.create('myaccount', '10000000.000 TOK')//, options)

  // Issue some of the max supply for circulation into an arbitrary account
  myaccount.issue('myaccount', '10000.000 TOK', 'issue')
})

const balance = await agr.getCurrencyBalance('myaccount', 'myaccount', 'TOK')
console.log('Currency Balance', balance)
```

### Calling Actions

Other ways to use contracts and transactions.

```javascript
// if either transfer fails, both will fail (1 transaction, 2 messages)
await agr.transaction(agr =>
  {
    agr.transfer('inita', 'initb', '1.0000 AGR', ''/*memo*/)
    agr.transfer('inita', 'initc', '1.0000 AGR', ''/*memo*/)
    // Returning a promise is optional (but handled as expected)
  }
  // [options],
  // [callback]
)

// transaction on a single contract
await agr.transaction('myaccount', myaccount => {
  myaccount.transfer('myaccount', 'inita', '10.000 TOK@myaccount', '')
})

// mix contracts in the same transaction
await agr.transaction(['myaccount', 'agrio.token'], ({myaccount, agrio_token}) => {
  myaccount.transfer('inita', 'initb', '1.000 TOK@myaccount', '')
  agrio_token.transfer('inita', 'initb', '1.0000 AGR', '')
})

// The contract method does not take an array so must be called once for
// each contract that is needed.
const myaccount = await agrio.contract('myaccount')
await myaccount.transfer('myaccount', 'inita', '1.000 TOK', '')

// a transaction to a contract instance can specify multiple actions
await myaccount.transaction(myaccountTr => {
  myaccountTr.transfer('inita', 'initb', '1.000 TOK', '')
  myaccountTr.transfer('initb', 'inita', '1.000 TOK', '')
})
```

# Development

From time-to-time the agrks and agrnode binary format will change between releases
so you may need to start `agrnode` with the `--skip-transaction-signatures` parameter
to get your transactions to pass.

Note, `package.json` has a "main" pointing to `./lib`.  The `./lib` folder is for
es2015 code built in a separate step. If you're changing and testing code,
import from `./src` instead.

```javascript
new Agr = require('./src')

// forceActionDataHex = false helps transaction readability but may trigger back-end bugs
config = {verbose: true, debug: false, broadcast: true, forceActionDataHex: true, keyProvider}

const agr = new Agr(config)
```

#### Fcbuffer

The `agr` instance can provide serialization:

```javascript
// 'asset' is a type but could be any struct or type like: transaction or uint8
type = {type: 1, data: '00ff'}
buffer = agr.fc.toBuffer('extensions_type', type)
assert.deepEqual(type, agr.fc.fromBuffer('extensions_type', buffer))

// ABI Serialization
agr.contract('agrio.token', (error, agrio_token) => {
  create = {issuer: 'inita', maximum_supply: '1.0000 AGR'}
  buffer = agrio_token.fc.toBuffer('create', create)
  assert.deepEqual(create, agrio_token.fc.fromBuffer('create', buffer))
})
```

Use Node v10+ for `package-lock.json`.

# Related Libraries

These libraries are integrated into `eosjs` seamlessly so you probably do not
need to use them directly.  They are exported here giving more API access or
in some cases may be used standalone.

```javascript
var {format, api, ecc, json, Fcbuffer} = Eos.modules
```
* format [./format.md](./docs/format.md)
  * Blockchain name validation
  * Asset string formatting

* eosjs-api [[Github](https://github.com/eosio/eosjs-api), [NPM](https://www.npmjs.org/package/eosjs-api)]
  * Remote API to an EOS blockchain node (nodeos)
  * Use this library directly if you need read-only access to the blockchain
    (don't need to sign transactions).

* eosjs-ecc [[Github](https://github.com/eosio/eosjs-ecc), [NPM](https://www.npmjs.org/package/eosjs-ecc)]
  * Private Key, Public Key, Signature, AES, Encryption / Decryption
  * Validate public or private keys
  * Encrypt or decrypt with EOS compatible checksums
  * Calculate a shared secret

* json {[api](https://github.com/EOSIO/eosjs-api/blob/master/src/api), [schema](https://github.com/EOSIO/eosjs/blob/master/src/schema)},
  * Blockchain definitions (api method names, blockchain schema)

* eosjs-keygen [[Github](https://github.com/eosio/eosjs-keygen), [NPM](https://www.npmjs.org/package/eosjs-keygen)]
  * private key storage and key management

* Fcbuffer [[Github](https://github.com/eosio/eosjs-fcbuffer), [NPM](https://www.npmjs.org/package/fcbuffer)]
  * Binary serialization used by the blockchain
  * Clients sign the binary form of the transaction
  * Allows client to know what it is signing

# Environment

Node and browser (es2015)
