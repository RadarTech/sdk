import { TransactionOpts } from '0x.js';
import BigNumber from 'bignumber.js';
import Web3 = require('web3');
import { LocalAccount } from './accounts/LocalAccount';
import { RpcAccount } from './accounts/RpcAccount';
import { InjectedAccount } from './accounts/InjectedAccount';
export { RadarToken, RadarMarket } from '@radarrelay/types';
export interface RadarEndpointConfig {
    endpoint: string;
    websocketEndpoint: string;
}
export interface RadarRelayConfig extends RadarEndpointConfig {
    sdkInitializationTimeout?: number;
}
export interface EthereumConfig {
    defaultGasPrice?: BigNumber;
}
export interface InjectedWalletConfig extends EthereumConfig {
    type: InjectedWalletType;
    web3?: Web3;
    dataRpcUrl?: string;
}
export interface CoreWalletOptions {
    password: string;
    seedPhrase?: string;
    salt?: string;
    hdPathString?: string;
}
export interface LightWalletConfig extends EthereumConfig {
    wallet: CoreWalletOptions;
    dataRpcUrl: string;
}
export interface RpcWalletConfig extends EthereumConfig {
    rpcUrl: string;
}
export interface PartialTxParams {
    nonce: string;
    gasPrice?: string;
    gas: string;
    to: string;
    from?: string;
    value?: string;
    data?: string;
    chainId: number;
}
export interface Opts {
    transactionOpts?: TransactionOpts;
    awaitTransactionMined?: boolean;
}
export interface MsgParams {
    from: string;
    data: string;
}
export interface UnsignedPayload {
    type: PayloadType;
    params: PartialTxParams | MsgParams;
}
export interface Signer {
    signPersonalMessageAsync(account: string, message: string): Promise<string>;
    signPersonalMessageHashAsync(account: string, hash: string): Promise<string>;
    signTransactionAsync(txParams: PartialTxParams): Promise<string>;
}
export interface Wallet {
    type: WalletType;
    signer: Signer;
    getAccounts(): string[];
    addNewAccounts(numberOfAccounts: number): void;
    exportSeedPhraseAsync(password: string): string;
    exportAccountPrivateKeyAsync(account: string, password: string): any;
}
export interface TransactionManager {
    getAccounts(): string[];
    signTransactionAsync(unsignedTx: UnsignedPayload): Promise<any>;
    signMessageAsync(unsignedMsg: UnsignedPayload): Promise<any>;
}
export declare enum PayloadType {
    Tx = 0,
    Msg = 1,
    PersonalMsg = 2
}
export declare enum WalletType {
    Local = 0,
    Rpc = 1,
    Injected = 2,
    Ledger = 3
}
export declare enum InjectedWalletType {
    Metmask = 0
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
export declare type RpcConnection = string | InfuraNetwork;
export declare type Account = LocalAccount | RpcAccount | InjectedAccount;
export declare type WalletConfig = LightWalletConfig | RpcWalletConfig | InjectedWalletConfig;
