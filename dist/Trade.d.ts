/// <reference types="node" />
import { Market } from './Market';
import { EventEmitter } from 'events';
import { Opts } from './types';
import { SignedOrder } from '0x.js';
import { ZeroEx } from './ZeroEx';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import { UserOrderType } from '@radarrelay/types';
import BigNumber from 'bignumber.js';
import { BaseAccount } from './accounts';
export declare class Trade<T extends BaseAccount> {
    private _endpoint;
    private _account;
    private _zeroEx;
    private _events;
    constructor(zeroEx: ZeroEx, apiEndpoint: string, account: T, events: EventEmitter);
    marketOrder(market: Market<T>, type: UserOrderType, quantity: BigNumber, opts?: Opts): Promise<TransactionReceiptWithDecodedLogs | string>;
    limitOrder(market: Market<T>, type: UserOrderType, // ask == sell, bid == buy
    quantity: BigNumber, // base token quantity
    price: BigNumber, // price (in quote)
    expiration: BigNumber): Promise<SignedOrder>;
    cancelOrderAsync(order: SignedOrder, opts?: Opts): Promise<TransactionReceiptWithDecodedLogs | string>;
    /**
     * Transform all BigNumber fields from string (request) to BigNumber. This is needed for a
     * correct hashing and signature.
     * @param order a signedOrder from DB or user input, that have strings instead of BigNumbers
     */
    hydrateSignedOrder(order: SignedOrder): SignedOrder;
}
