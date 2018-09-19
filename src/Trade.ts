import { Market } from './Market';
import { EventEmitter } from 'events';
import { WalletType, Opts, EventName } from './types';
import { Order, SignedOrder, SignerType } from '0x.js';
import { ZeroEx } from './ZeroEx';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import { RadarToken, UserOrderType, RadarMarketOrderResponse } from '@radarrelay/types';
import BigNumber from 'bignumber.js';
import request = require('request-promise');
import { TSMap } from 'typescript-map';
import { BaseAccount } from './accounts';

export class Trade<T extends BaseAccount> {

  private _endpoint: string;
  private _account: T;
  private _zeroEx: ZeroEx;
  private _events: EventEmitter;

  constructor(
    zeroEx: ZeroEx,
    apiEndpoint: string,
    account: T,
    events: EventEmitter) {
    this._zeroEx = zeroEx;
    this._endpoint = apiEndpoint;
    this._account = account;
    this._events = events;
  }

  public async marketOrder(
    market: Market<T>,
    type: UserOrderType,
    quantity: BigNumber,
    opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const marketResponse: RadarMarketOrderResponse = await request.post({
      url: `${this._endpoint}/markets/${market.id}/order/market`,
      json: {
        type,
        quantity: quantity.toString(), // base token in unit amounts, which is what our interfaces use
      }
    });

    marketResponse.orders.forEach((order, i) => this.hydrateSignedOrder(order));

    let txHash: string;
    if (marketResponse.orders.length === 1) {
      // Save gas by executing a fill order if only one order was returned
      txHash = await this._zeroEx.exchange.fillOrderAsync(
        marketResponse.orders[0],
        ZeroEx.toBaseUnitAmount(quantity, market.baseTokenDecimals.toNumber()),
        this._account.address,
        opts.transactionOpts);
    } else {
      const fn = type === UserOrderType.BUY ? 'marketBuyOrdersAsync' : 'marketSellOrdersAsync';
      txHash = await this._zeroEx.exchange[fn](
        marketResponse.orders,
        ZeroEx.toBaseUnitAmount(quantity, market.baseTokenDecimals.toNumber()),
        this._account.address,
        opts.transactionOpts);
    }

    this._events.emit(EventName.TransactionPending, txHash);

    if (!opts.awaitTransactionMined) {
      return txHash;
    }
    const receipt = await this._zeroEx.awaitTransactionMinedAsync(txHash);
    this._events.emit(EventName.TransactionComplete, receipt);
    return receipt;
  }

  // sign and post order to book
  public async limitOrder(
    market: Market<T> = null,
    type: UserOrderType, // ask == sell, bid == buy
    quantity: BigNumber, // base token quantity
    price: BigNumber, // price (in quote)
    expiration: BigNumber // expiration in seconds from now
  ): Promise<SignedOrder> {

    const order = await request.post({
      url: `${this._endpoint}/markets/${market.id}/order/limit`,
      json: {
        type,
        quantity: quantity.toString(), // base token in unit amounts, which is what our interfaces use
        price: price.toString(),
        expiration: expiration.toString()
      }
    });

    // turn into BigNumbers
    this.hydrateSignedOrder(order);

    // add missing data
    order.makerAddress = this._account.address;

    // sign order
    const prefix: SignerType = (this._account.type === WalletType.Injected) ? SignerType.Metamask : SignerType.Default;
    const orderHash = ZeroEx.getOrderHashHex(order);
    const signature = await this._zeroEx.ecSignOrderHashAsync(orderHash, this._account.address, prefix);
    (order as SignedOrder).signature = signature;

    // POST order to API
    // HACK for local dev order seeding
    const orderPostURL = process.env.RADAR_SDK_ORDER_URL
      ? process.env.RADAR_SDK_ORDER_URL
      : `${this._endpoint}/orders`;

    await request.post({
      url: orderPostURL,
      json: order
    });

    return order;
  }

  // TODO fill individual order

  // cancel a signed order
  // TODO cancel partial?
  public async cancelOrderAsync(
    order: SignedOrder, opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const txHash = await this._zeroEx.exchange.cancelOrderAsync(order, opts.transactionOpts);
    this._events.emit(EventName.TransactionPending, txHash);

    if (!opts.awaitTransactionMined) {
      return txHash;
    }

    const receipt = await this._zeroEx.awaitTransactionMinedAsync(txHash);
    this._events.emit(EventName.TransactionComplete, receipt);
    return receipt;
  }

  /**
   * Transform all BigNumber fields from string (request) to BigNumber. This is needed for a
   * correct hashing and signature.
   * @param order a signedOrder from DB or user input, that have strings instead of BigNumbers
   */
  public hydrateSignedOrder(order: SignedOrder): SignedOrder {
    order.salt = new BigNumber(order.salt);
    order.makerFee = new BigNumber(order.makerFee);
    order.takerFee = new BigNumber(order.takerFee);
    order.makerAssetAmount = new BigNumber(order.makerAssetAmount);
    order.takerAssetAmount = new BigNumber(order.takerAssetAmount);
    order.expirationTimeSeconds = new BigNumber(order.expirationTimeSeconds);
    return order;
  }

}
