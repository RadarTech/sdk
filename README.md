---
path: "/sdk"
version: "0.2.5"
---

# Radar Relay SDK

The Radar Relay SDK is a software development kit that simplifies the interactions with [Radar Relay’s APIs](https://docs.radarrelay.com).

[![npm version](https://badge.fury.io/js/%40radarrelay%2Fsdk.svg)](https://badge.fury.io/js/%40radarrelay%2Fsdk)
[![CircleCI](https://circleci.com/gh/RadarRelay/sdk/tree/beta.svg?style=svg&circle-token=5455f6ae9c40e32054b1b54c6caec01af6806754)](https://circleci.com/gh/RadarRelay/sdk/tree/beta)

## SDK Reference
For a full SDK reference see: [docs.radarrelay.com/sdk-reference](https://docs.radarrelay.com/sdk-reference).

## Usage

### Setup
`~ npm install @radarrelay/sdk` or `~ yarn add @radarrelay/sdk`

```javascript
import RadarRelay from '@radarrelay/sdk';

const rr = new RadarRelay({
  endpoint: string; // endpoint for radar relay's api: e.g. https://api.radarrelay.com/v0
  websocketEndpoint: string // endpoint for radar relay's websockers e.g. wss://ws.radarrelay.com
});
```

### Initialize
Initializing sets the desired Ethereum wallet configuration. The SDK can be initialized with three different wallet types: `LightWallet`, `InjectedWallet`, and an `RpcWallet`. See the below types for more information.

```javascript
rr.initialize(LightWalletConfig|InjectedWalletConfig|RpcWalletConfig); 
```

#### Wallet Configuration Types


```javascript 
interface EthereumConfig {
  defaultGasPrice?: BigNumber;
}
```

```javascript 
interface CoreWalletOptions {
  password: string;
  seedPhrase?: string;
  salt?: string;
  hdPathString?: string;
}
```

```javascript 
interface LightWalletConfig extends EthereumConfig {
  wallet: CoreWalletOptions; // Wallet options for a local HD wallet
  dataRpcUrl: string;  // the rpc connection used to broadcast transactions and retreive Ethereum chain state
}
```

```javascript 
interface InjectedWalletConfig extends EthereumConfig {
  type: InjectedWalletType;
  web3: Web3; // Injected web3 object
  dataRpcUrl: string; // the rpc connection used to broadcast transactions and retreive Ethereum chain state
}
```

```javascript 
interface RpcWalletConfig extends EthereumConfig {
  walletRpcUrl: string; // The RPC connection to an unlocked node
  dataRpcUrl: string; // The rpc connection used to broadcast transactions and retreive Ethereum chain state
}
```



### Events
Anything that triggers state changes (like changing the network, or a fill)
fires an event that you can listen to via the `events` object.

```javascript

rr.events.on(
  'loading'
  'ethereumInitialize'
  'ethereumNetworkIdInitialized' 
  'zeroExInitialized'
  'tokensInitialized'
  'accountInitialized'
  'tradeInitialized'
  'marketsInitialized'
  'transactionPending'
  'transactionMined'
)
rr.events.emit('see_above' | 'or emit anything', with, some, data)
```

### Account
Obtain account information for the current loaded wallet

```javascript
// wallet methods
rr.account.exportSeedPhraseAsync
rr.account.exportAddressPrivateKeyAsync

// account information
rr.account.getAvailableAddressesAsync
rr.account.setAddressAsync
rr.account.getFillsAsync
rr.account.getOrdersAsync

// ETH / token utilities
rr.account.getEthBalanceAsync
rr.account.transferEthAsync
rr.account.wrapEthAsync
rr.account.unwrapEthAsync
rr.account.getTokenBalanceAsync
rr.account.getTokenAllowanceAsync
rr.account.setTokenAllowanceAsync
rr.account.transferTokenAsync
```
### Markets
Markets are marketId mapped Market classes with all 
the same methods and the following instance vars:

```javascript
rr.markets.get('ZRX-WETH') 
{
  id: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseTokenDecimals: BigNumber;
  quoteTokenDecimals: BigNumber;
  minOrderSize: BigNumber;
  maxOrderSize: BigNumber;
  quoteIncrement: BigNumber;
  displayName: string;
}
```

Markets expose the following methods:

```javascript
// market class methods
rr.markets.get('ZRX-WETH').limitOrderAsync
rr.markets.get('REP-WETH').marketOrderAsync
rr.markets.get('REP-WETH').cancelOrderAsync
rr.markets.get('ZRX-WETH').getFillsAsync
rr.markets.get('ZRX-WETH').getCandlesAsync
rr.markets.get('ZRX-WETH').getTickerAsync
rr.markets.get('ZRX-WETH').getOrderBookAsync

// Subscriptions
// NOTE: CANDLE and TICKER topics are not yet supported.
const subscription = await rr.markets.get('ZRX-WETH').subscribeAsync(
  WebsocketRequestTopic.BOOK, handlerFunction
);

// Unsubscribe to a previously created subscription
subscription.unsubscribe();

```

## Setting up an Ethereum Node

**Install Parity**

```
brew install parity
```

**Run Parity Node**
```
parity --jsonrpc-hosts=all \
       --jsonrpc-interface=all \
       --ws-origins=all \
       --ws-hosts=all \
       --ws-interface=all \
       --chain=kovan \
       --base-path /path/for/ethereum_node_data
```

### Unlocked Parity Node

_NOTE: this is potentially dangerous, use at your own risk. Should be done on a computer free of malware and a strict firewall_

**Create a trading Account**

```
~parity account new
~enter password (don't lose this)
```

**Create Node Config File**

create `/path/to/parity-config.toml`

```
[account]
unlock = ["0x000000000000000000000000000000000000"] (account address created above)
password = ["/home/{account}/.parity-account-pass"] (password saved in plain text)
```

**Run Parity with Unlocked Account**

```
parity --jsonrpc-hosts=all \
       --jsonrpc-interface=all \
       --ws-origins=all \
       --ws-hosts=all \
       --ws-interface=all \
       --chain=kovan \
       --config /path/to/parity-config.toml \
       --base-path /path/for/ethereum_node_data
```

## SDK Init / State Change Lifecycle

### Overview

The Ethereum and 0x.js application loading lifecycle is difficult to manage, especially when designing for optimized state changes. Specifically, changing RPC Networks, switching accounts, and updating API endpoints. To manage the lifecycle more efficiently, the Radar Relay SDK utilizes a combination of the following:

* [`EventEmitter`](https://nodejs.org/api/events.html)
* [`SDKInitLifeCycle `](https://github.com/RadarRelay/radar-relay-sdk/blob/beta/src/sdk-init-lifecycle.ts)

--- 

The `SDKInitLifeCycle` class works as follows:

Define an array that consists of: 

   1. `event`, which when triggered will then call the defined
   2. `func` the function that is called when this event is triggered (ideally the next in priority)

Once all events have fired the promise will resolve. If an error occurs along the lifecycle, the timeout will occur after 10s and reject the promise.

Each init method must trigger an event on the `EventEmitter`, which indicates the method is done as well as return the `SDKInitLifeCycle.promise()`

### Life Cycle

![](https://docs.google.com/drawings/d/e/2PACX-1vS-ZE8iqFN6qm9iY_pqtJfElw2iwR-THeM1MuUYCH4H_9uAMAOv1ogEt72f0SuEZFB6tnfd4hm7NGuo/pub?w=929&h=580)
