/// <reference types="node" />
import { TransactionOpts } from '0x.js';
import { ZeroEx } from '../src/ZeroEx';
import BigNumber from 'bignumber.js';
import Web3 = require('web3');
import { LocalAccount } from './accounts/LocalAccount';
import { RpcAccount } from './accounts/RpcAccount';
import { InjectedAccount } from './accounts/InjectedAccount';
import { Ethereum } from './Ethereum';
import { EventEmitter } from 'events';
import { RadarToken } from '@radarrelay/types';
import { LoadableMap } from './LoadableMap';
export * from '@radarrelay/types';
export interface SdkConfig {
    sdkInitializationTimeoutMs?: number;
}
export interface EndpointConfig {
    radarRestEndpoint: string;
    radarWebsocketEndpoint: string;
}
export interface OptionalEndpointConfig {
    radarRestEndpoint?: string;
    radarWebsocketEndpoint?: string;
}
export interface EthereumConfig {
    defaultGasPrice?: BigNumber;
}
export interface InjectedWalletConfig extends SdkConfig, OptionalEndpointConfig, EthereumConfig {
    type: InjectedWalletType;
    web3?: Web3;
    dataRpcUrl?: string;
}
export interface LightWalletOptions {
    password: string;
    seedPhrase?: string;
    salt?: string;
    hdPathString?: string;
}
export interface LightWalletConfig extends SdkConfig, EndpointConfig, EthereumConfig {
    wallet: LightWalletOptions;
    dataRpcUrl: string;
}
export interface RpcWalletConfig extends SdkConfig, EndpointConfig, EthereumConfig {
    rpcUrl: string;
}
export interface Opts {
    transactionOpts?: TransactionOpts;
    awaitTransactionMined?: boolean;
}
export declare enum WalletType {
    Local = 0,
    Rpc = 1,
    Injected = 2,
    Ledger = 3
}
export declare enum InjectedWalletType {
    Metmask = "metamask"
}
export declare enum InfuraNetwork {
    Mainnet = "mainnet",
    Kovan = "kovan",
    Rinkeby = "rinkeby",
    Ropsten = "ropsten"
}
export declare enum NetwordId {
    Mainnet = 1,
    Kovan = 42,
    Rinkeby = 4,
    Ropsten = 3
}
export declare enum EventName {
    Loading = "loading",
    EthereumInitialized = "ethereumInitialized",
    EthereumNetworkIdInitialized = "ethereumNetworkIdInitialized",
    ZeroExInitialized = "zeroExInitialized",
    TokensInitialized = "tokensInitialized",
    AccountInitialized = "accountInitialized",
    TradeInitialized = "tradeInitialized",
    MarketsInitialized = "marketsInitialized",
    TransactionPending = "transactionPending",
    TransactionComplete = "transactionComplete",
    AddressChanged = "addressChanged"
}
export declare enum SdkError {
    InvalidOrMissingEndpoints = "INVALID_OR_MISSING_RADAR_RELAY_ENDPOINTS",
    WebSocketDisconnected = "WEBSOCKET_DISCONNECTED",
    UnableToRetrieveAccount = "UNABLE_TO_RETRIEVE_ACCOUNT"
}
export declare type RpcConnection = string | InfuraNetwork;
export declare type Account = LocalAccount | RpcAccount | InjectedAccount;
export declare type Config = LightWalletConfig | RpcWalletConfig | InjectedWalletConfig;
export interface AccountParams {
    ethereum: Ethereum;
    events: EventEmitter;
    zeroEx: ZeroEx;
    endpoint: string;
    tokens: LoadableMap<string, RadarToken>;
}
