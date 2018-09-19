import { Ethereum } from '../Ethereum';
import { promisify } from 'util';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import { ZeroEx } from '../ZeroEx';
import BigNumber from 'bignumber.js';
import { Opts, AccountParams, WalletType } from '../types';
import * as request from 'request-promise';
import { RadarFill, RadarSignedOrder, RadarToken } from '@radarrelay/types';
import { TSMap } from 'typescript-map';
import { EventEmitter } from 'events';
import { LoadableMap } from '../LoadableMap';

export class BaseAccount {
  public readonly type: WalletType;
  public address: string;
  protected _ethereum: Ethereum;
  protected _events: EventEmitter;
  private _zeroEx: ZeroEx;
  private _endpoint: string;
  private _tokens: LoadableMap<string, RadarToken>;

  /**
   * Instantiate a new BaseAccount
   *
   * @param {AccountParams} params The account parameters
   */
  constructor(params: AccountParams) {
    this._ethereum = params.ethereum;
    this._events = params.events;
    this._zeroEx = params.zeroEx;
    this._endpoint = params.endpoint;
    this._tokens = params.tokens;
    this.address = this._ethereum.defaultAccount;
  }

  /**
   * Get available addresses for this account
   */
  public async getAvailableAddressesAsync(): Promise<string[]> {
    return await promisify(this._ethereum.web3.eth.getAccounts)();
  }

  /**
   * Get ETH balance for the current selected address
   */
  public async getEthBalanceAsync(): Promise<BigNumber> {
    const balance = await this._ethereum.getEthBalanceAsync(this.address);
    return ZeroEx.toUnitAmount(balance, 18);
  }

  /**
   * Transfer ETH to another address
   *
   * @param {string} toAddress The address to transfer to
   * @param {BigNumber} amount The amount of ETH to transfer
   * @param {Opts} [opts] The transaction options
   */
  public async transferEthAsync(
    toAddress: string, amount: BigNumber, opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const txOpts = {
      gasPrice: opts.transactionOpts ? opts.transactionOpts.gasPrice : undefined,
      gas: opts.transactionOpts ? opts.transactionOpts.gasLimit : undefined
    };
    const txHash = await this._ethereum.transferEthAsync(this.address, toAddress, amount, txOpts);
    if (!opts.awaitTransactionMined) {
      return txHash;
    }
    return await this._zeroEx.awaitTransactionMinedAsync(txHash);
  }

  /**
   * Wrap ETH to convert it to WETH
   *
   * @param {BigNumber} amount The amount of ETH to wrap
   * @param {Opts} [opts] The transaction options
   */
  public async wrapEthAsync(
    amount: BigNumber, opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const txHash = await this._zeroEx.etherToken.depositAsync(
      this._getWETHTokenAddress(), ZeroEx.toBaseUnitAmount(amount, 18), this.address, opts.transactionOpts
    );
    if (!opts.awaitTransactionMined) {
      return txHash;
    }
    return await this._zeroEx.awaitTransactionMinedAsync(txHash);
  }

  /**
   * Unwrap WETH to convert it to ETH
   *
   * @param {BigNumber} amount The amount of WETH to unwrap
   * @param {Opts} [opts] The transaction options
   */
  public async unwrapEthAsync(
    amount: BigNumber, opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const txHash = await this._zeroEx.etherToken.withdrawAsync(
      this._getWETHTokenAddress(), ZeroEx.toBaseUnitAmount(amount, 18), this.address, opts.transactionOpts);
    if (!opts.awaitTransactionMined) {
      return txHash;
    }
    return await this._zeroEx.awaitTransactionMinedAsync(txHash);
  }

  /**
   * Get balance of a token for the current selected address
   *
   * @param {string} tokenAddress The token address
   */
  public async getTokenBalanceAsync(tokenAddress: string): Promise<BigNumber> {
    const balance = await this._zeroEx.erc20Token.getBalanceAsync(tokenAddress, this.address);
    return ZeroEx.toUnitAmount(balance, (await this._tokens.get(tokenAddress)).decimals);
  }

  /**
   * Transfer tokens to another address
   *
   * @param {string} tokenAddress The token address
   * @param {string} toAddress The address to transfer to
   * @param {BigNumber} amount The amount of token to transfer
   * @param {Opts} [opts] The transaction options
   */
  public async transferTokenAsync(
    tokenAddress: string, toAddress: string, amount: BigNumber, opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const amt = ZeroEx.toBaseUnitAmount(amount, (await this._tokens.get(tokenAddress)).decimals);
    const txHash = await this._zeroEx.erc20Token.transferAsync(tokenAddress, this.address, toAddress, amt, opts.transactionOpts);
    if (!opts.awaitTransactionMined) {
      return txHash;
    }
    return await this._zeroEx.awaitTransactionMinedAsync(txHash);
  }

  /**
   * Get a token allowance
   *
   * @param {string} tokenAddress The token address
   */
  public async getTokenAllowanceAsync(tokenAddress: string): Promise<BigNumber> {
    const baseUnitallowance = await this._zeroEx.erc20Token.getProxyAllowanceAsync(tokenAddress, this.address);
    return ZeroEx.toUnitAmount(baseUnitallowance, (await this._tokens.get(tokenAddress)).decimals);
  }

  /**
   * Set a token allowance
   *
   * @param {string} tokenAddress The token address
   * @param {BigNumber} amount The allowance amount
   * @param {Opts} [opts] The transaction options
   */
  public async setTokenAllowanceAsync(
    tokenAddress: string, amount: BigNumber, opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const amt = ZeroEx.toBaseUnitAmount(amount, (await this._tokens.get(tokenAddress)).decimals);
    const txHash = await this._zeroEx.erc20Token.setProxyAllowanceAsync(tokenAddress, this.address, amt, opts.transactionOpts);
    if (!opts.awaitTransactionMined) {
      return txHash;
    }
    return await this._zeroEx.awaitTransactionMinedAsync(txHash);
  }

  /**
   * Set unlimited token allowance
   *
   * @param {string} tokenAddress The token address
   * @param {Opts} [opts] The transaction options
   */
  public async setUnlimitedTokenAllowanceAsync(
    tokenAddress: string, opts?: Opts
  ): Promise<TransactionReceiptWithDecodedLogs | string> {
    if (!opts) {
      opts = {};
    }

    const txHash = await this._zeroEx.erc20Token.setUnlimitedProxyAllowanceAsync(tokenAddress, this.address, opts.transactionOpts);
    if (!opts.awaitTransactionMined) {
      return txHash;
    }
    return await this._zeroEx.awaitTransactionMinedAsync(txHash);
  }

  /**
   * Get orders for the selected address that have been placed on Radar
   *
   * @param {number} page The page to fetch
   * @param {number} perPage The number of orders per page
   */
  public async getOrdersAsync(page: number = 1, perPage: number = 100): Promise<RadarSignedOrder[]> {
    return JSON.parse(await request.get(
      `${this._endpoint}/accounts/${this.address}/orders?page=${page}&perPage=${perPage}`
    ));
  }

  /**
   * Get fills for the selected address that have been executed on Radar
   *
   * @param {number} page The page to fetch
   * @param {number} perPage The number of fills per page
   */
  public async getFillsAsync(page: number = 1, perPage: number = 100): Promise<RadarFill[]> {
    return JSON.parse(await request.get(
      `${this._endpoint}/accounts/${this.address}/fills?page=${page}&perPage=${perPage}`
    ));
  }

  private _getWETHTokenAddress(): string {
    let token;
    this._tokens.forEach(t => {
      if (t.symbol === 'WETH') {
        token = t;
      }
    });
    return token.address;
  }
}
