# Radar Relay SDK

The Radar Relay SDK is a software development kit that simplifies the interactions with [Radar Relay’s APIs](https://developers.radarrelay.com).

[![npm version](https://badge.fury.io/js/%40radarrelay%2Fsdk.svg)](https://badge.fury.io/js/%40radarrelay%2Fsdk)
[![CircleCI](https://circleci.com/gh/RadarRelay/sdk/tree/beta.svg?style=svg&circle-token=5455f6ae9c40e32054b1b54c6caec01af6806754)](https://circleci.com/gh/RadarRelay/sdk/tree/beta)

## SDK Reference
For a full SDK reference see: [developers.radarrelay.com/sdk](https://developers.radarrelay.com/sdk/v2).

## Usage

### Installation

#### Using `npm`
`npm install @radarrelay/sdk`

#### Using `yarn`
`yarn add @radarrelay/sdk`

### Setup & Initialize
**Setup** refers to the instantiation of the `RadarRelay` class and setup for the initialization lifecycle.

**Initialize** refers to the execution of the "initialization lifecycle" - A collection of asynchronous operations that hook up the wallet, set the web3 provider, and spin up the classes necessary to begin trading.

Setup and initialization of the SDK can be completed in a single call if you don't want to listen for initialization events.

```javascript
import { SdkManager } from '@radarrelay/sdk';

const rr = await SdkManager.SetupAndInitializeAsync(Config); // Radar API and Wallet Configuration
```


### Setup
Setup can be separated from initialization, which is useful if you would like to add listeners for the various initialization events.

```javascript
import { SdkManager } from '@radarrelay/sdk';

const rr = SdkManager.Setup(Config); // Radar API and Wallet Configuration
```

### Initialize
Initializing sets the desired Ethereum wallet configuration. The SDK can be initialized with three different wallet types: `LightWallet`, `InjectedWallet`, and an `RpcWallet`. See the below types for more information.

```javascript
await SdkManager.InitializeAsync(rr);
```

Or directly on the SDK instance:

```javascript
await rr.initializeAsync();
```

#### Wallet Configuration Types
```javascript
interface SdkConfig {
  sdkInitializationTimeoutMs?: number;
}
```

```javascript
interface EndpointConfig {
  radarRestEndpoint: string;
  radarWebsocketEndpoint: string;
}
```

```javascript
// Injected Wallets do not require an endpoint argument if using the wallet's connection to the Ethereum network
export interface OptionalEndpointConfig {
  radarRestEndpoint?: string;
  radarWebsocketEndpoint?: string;
}
```

```javascript
interface EthereumConfig {
  defaultGasPrice?: BigNumber;
}
```

```javascript
interface LightWalletOptions {
  password: string;
  seedPhrase?: string;
  salt?: string;
  hdPathString?: string;
}
```

```javascript
interface LightWalletConfig extends SdkConfig, EndpointConfig, EthereumConfig {
  wallet: LightWalletOptions; // Wallet options for a local HD wallet
  dataRpcUrl: string;  // The rpc connection used to broadcast transactions and retreive Ethereum chain state
}
```

```javascript
interface InjectedWalletConfig extends SdkConfig, OptionalEndpointConfig, EthereumConfig {
  type: InjectedWalletType;
  web3?: Web3; // Injected web3 object (Default: window.web3)
  dataRpcUrl?: string; // Rpc connection used to broadcast transactions and retreive Ethereum chain state (Default: Injected Web3 Connection)
}
```

```javascript
interface RpcWalletConfig extends SdkConfig, EndpointConfig, EthereumConfig {
  rpcUrl: string; // The RPC connection to an unlocked node
}
```

## Events
Anything that triggers state changes (like changing the network, or a fill)
fires an event that you can listen to via the `events` object.

```javascript

rr.events.on(
  EventName.Loading |
  EventName.EthereumInitialized |
  EventName.EthereumNetworkIdInitialized |
  EventName.ZeroExInitialized |
  EventName.TokensInitialized |
  EventName.AccountInitialized |
  EventName.TradeInitialized |
  EventName.MarketsInitialized |
  EventName.TransactionPending |
  EventName.TransactionComplete |
  EventName.AddressChanged
)
rr.events.emit('see_above' | 'or emit anything', ...withSomeData)
```

## Account Methods
Obtain account information for the current loaded wallet.

---

### Wallet methods

`exportSeedPhraseAsync(password)`

Export an account wallet seed phrase.

**Parameters:**

| Name             | Type        | Description                                                                         |
| ---------------- | ----------- | ----------------------------------------------------------------------------------- |
| `password`       | `string`    | The plaintext password                                                              |

**Returns:** `Promise<string>`

---

`exportAddressPrivateKeyAsync(password)`

Export a wallet address private key.

**Parameters:**

| Name             | Type        | Description                                                                         |
| ---------------- | ----------- | ----------------------------------------------------------------------------------- |
| `password`       | `string`    | The plaintext password                                                              |

**Returns:** `Promise<string>`

---

### Account information

`getAvailableAddressesAsync(address)`

Get available addresses for this account.

**_No parameters._**

**Returns:** `Promise<string[]>`

---

`setAddressAsync(address)`

Set the current address in use.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `address`        | `string\|number`    | The address or address index                                                |

**Returns:** `Promise<void>`

---

`getFillsAsync(page?, perPage?)`

Get fills for the selected address that have been executed on Radar.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `page`           | `number`           | _[Optional]_ The page to fetch                                               |
| `perPage`        | `number`           | _[Optional]_ The number of fills per page                                    |

**Returns:** `Promise<RadarFill>`

---

`getOrdersAsync(page?, perPage?)`

Get orders for the selected address that have been placed on Radar.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `page`           | `number`           | _[Optional]_ The page to fetch                                               |
| `perPage`        | `number`           | _[Optional]_ The number of fills per page                                    |

**Returns:** `Promise<RadarSignedOrder[]>`

---

### ETH / token utilities

`getEthBalanceAsync()`

Get ETH balance for the current selected address.

**_No parameters._**

**Returns:** `Promise<BigNumber>`

---

`transferEthAsync(toAddress, perPage, opts?)`

Transfer ETH to another address.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `toAddress`      | `string`           | The address to transfer to                                                   |
| `amount`         | `number`           | The amount of ETH to transfer                                                |
| `opts`           | `Opts`             | _[Optional]_ The transaction options                                         |

**Returns:** `Promise<TransactionReceiptWithDecodedLogs | string>`

---

`wrapEthAsync(amount, opts?)`

Wrap ETH to convert it to WETH.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `amount`         | `number`           | The amount of ETH to wrap                                                    |
| `opts`           | `Opts`             | _[Optional]_ The transaction options                                         |

**Returns:** `Promise<TransactionReceiptWithDecodedLogs | string>`

---

`unwrapEthAsync(amount, opts?)`

Unwrap WETH to convert it to ETH.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `amount`         | `number`           | The amount of ETH to unwrap                                                  |
| `opts`           | `Opts`             | _[Optional]_ The transaction options                                         |

**Returns:** `Promise<TransactionReceiptWithDecodedLogs | string>`

---

`getTokenBalanceAsync(tokenAddress)`

Get balance of a token for the current selected address.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `address`        | `string`           | The token address                                                            |

**Returns:** `Promise<BigNumber>`

---

`getTokenAllowanceAsync(tokenAddress)`

Get a token allowance.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `address`        | `string`           | The token address                                                            |

**Returns:** `Promise<BigNumber>`

---

`setTokenAllowanceAsync(tokenAddress, amount, opts?)`

Set a token allowance.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `tokenAddress`   | `string`           | The token address                                                            |
| `amount`         | `number`           | The allowance amount                                                         |
| `opts`           | `Opts`             | _[Optional]_ The transaction options                                         |

**Returns:** `Promise<TransactionReceiptWithDecodedLogs | string>`

---

`transferTokenAsync(tokenAddress, toAddress, amount, opts?)`

Set a token allowance.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `tokenAddress`   | `string`           | The token address                                                            |
| `toAddress`      | `string`           | The address to transfer to                                                   |
| `amount`         | `number`           | The amount of token to transfer                                              |
| `opts`           | `Opts`             | _[Optional]_ The transaction options                                         |

**Returns:** `Promise<TransactionReceiptWithDecodedLogs | string>`

---

## Market methods

Markets are `marketId`-mapped Market classes with all
the same methods and the following instance vars:

```javascript
// Markets are retrieved lazily and asynchronously.
// Keep this in mind when iterating over the `markets` Map.
await rr.markets.get('ZRX-WETH')
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

---

### Market class methods

`limitOrderAsync(type, quantity, price, expiration)`

Place a limit order.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `type`           | `UserOrderType`    | Order type of 'BUY'|'SELL'                                                   |
| `quantity`       | `BigNumber`        | Amount in base token                                                         |
| `price`          | `BigNumber`        | Price in quote                                                               |
| `expiration`     | `BigNumber`        | Order expiration time in seconds                                             |

**Returns:** `Promise<Order>`

---

`marketOrderAsync(type, amount, opts?)`

Execute a market order.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `type`           | `UserOrderType`    | Order type of 'BUY'|'SELL'                                                   |
| `amount`         | `BigNumber`        | Amount in base token                                                         |
| `opts`           | `Opts`             | _[Optional]_ The transaction options                                         |

**Returns:** `Promise<TransactionReceiptWithDecodedLogs | string>`

---

`cancelOrderAsync(order, opts?)`

Cancel an order.

**Parameters:**

| Name             | Type               | Description                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------- |
| `order`          | `SignedOrder`      | SignedOrder to cancel                                                        |
| `opts`           | `Opts`             | _[Optional]_ The transaction options                                         |

**Returns:** `Promise<TransactionReceiptWithDecodedLogs | string>`

---

`getFillsAsync()`

Get fills for this market.

**_No parameters._**

**Returns:** `Promise<RadarFill[]>`

---

`getCandlesAsync()`

Get candles for this market.

**_No parameters._**

**Returns:** `Promise<RadarCandle[]>`

---

`getTickerAsync()`

Get ticker for this market.

**_No parameters._**

**Returns:** `Promise<RadarTicker>`

---

`getHistoryAsync()`

Get history for this market.

**_No parameters._**

**Returns:** `Promise<RadarHistory>`

---

`getStatsAsync()`

Get stats for this market.

**_No parameters._**

**Returns:** `Promise<RadarStats>`

---

`subscribeAsync(topic, handlerFunc)`

**Parameters:**

| Name             | Type                     | Description                                                            |
| ---------------- | ------------------------ | ---------------------------------------------------------------------- |
| `topic`          | `WebsocketRequestTopic`  | The market topic                                                       |
| `handlerFunc`    | `(message: any) => void` | The subscription handler                                               |

**Returns:**

```javascript
Promise<{
  requestId: number,
  subscriptionHandler: (message: any) => void,
  unsubscribe: () => void
}>
```

You can unsubscribe from any previously created subscriptions like so:

```javascript
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
* [`SdkInitLifeCycle`](https://github.com/RadarRelay/sdk/blob/master/src/SdkInitLifeCycle.ts)

---

The `SdkInitLifeCycle` class works as follows:

Define an array that consists of:

   1. `event`, which when triggered will then call the defined
   2. `func` the function that is called when this event is triggered (ideally the next in priority)

Once all events have fired the promise will resolve. If an error occurs along the lifecycle, the timeout will occur after 10s and reject the promise.

Each init method must trigger an event on the `EventEmitter`, which indicates the method is done as well as return the `SdkInitLifeCycle.promise()`

### Life Cycle

![](https://docs.google.com/drawings/d/e/2PACX-1vS-ZE8iqFN6qm9iY_pqtJfElw2iwR-THeM1MuUYCH4H_9uAMAOv1ogEt72f0SuEZFB6tnfd4hm7NGuo/pub?w=929&h=580)
