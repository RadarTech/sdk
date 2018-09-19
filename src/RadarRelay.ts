
import { ZeroEx } from './ZeroEx';
import { EventEmitter } from 'events';
import { RadarToken, RadarMarket } from '@radarrelay/types';
import {
  InjectedWalletConfig,
  WalletType,
  Config,
  AccountParams,
  EventName,
  SdkError
} from './types';
import BigNumber from 'bignumber.js';
import request = require('request-promise');
import Web3 = require('web3');

// SDK Classes
import { SdkInitLifeCycle, InitPriorityItem } from './SdkInitLifeCycle';
import { Ethereum } from './Ethereum';
import { Market } from './Market';
import { LoadableMap } from './LoadableMap';
import { Trade } from './Trade';
import { RADAR_RELAY_ENDPOINTS } from './constants';
import { BaseAccount } from './accounts/BaseAccount';

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

/**
 * RadarRelay main SDK singleton
 */
export class RadarRelay<T extends BaseAccount> {

  public events: EventEmitter;
  public account: T;
  public tokens: LoadableMap<string, RadarToken>;
  public markets: LoadableMap<string, Market<T>>;
  public zeroEx: ZeroEx;
  public web3: Web3;

  private _trade: Trade<T>;
  private _ethereum: Ethereum;
  private _networkId: number;
  private _prevApiEndpoint: string;
  private _lifecycle: SdkInitLifeCycle;
  private _wallet: new (params: AccountParams) => T;
  private _config: Config;
  private _walletType: WalletType;

  /**
   * The load priority list maintains the function call
   * priority for each init method in the RadarRelaySDK class.
   * It is utilized by the SdkInitLifeCycle
   *
   * This list is configurable if additional init methods are necessary
   */
  private loadPriorityList: InitPriorityItem[] = [
    { event: EventName.EthereumInitialized, func: this.initEthereumNetworkIdAsync },
    { event: EventName.EthereumNetworkIdInitialized, func: this.initZeroEx },
    { event: EventName.ZeroExInitialized, func: this.initTokensAsync },
    { event: EventName.TokensInitialized, func: this.initAccountAsync, args: [0] }, // Pass default account of 0 to setAccount(...)
    { event: EventName.AccountInitialized, func: this.initTrade },
    { event: EventName.TradeInitialized, func: this.initMarketsAsync },
    { event: EventName.MarketsInitialized, func: undefined }
  ];

  /**
   * SDK instance
   *
   * @param {RadarRelayConfig} config  sdk config
   */
  constructor(wallet: new (params: AccountParams) => T, walletType: WalletType, config: Config) {
    this._wallet = wallet;
    this._walletType = walletType;
    this._config = config;

    // instantiate event handler
    this.events = new EventEmitter();

    // instantiate ethereum class
    this._ethereum = new Ethereum();

    // setup the _lifecycle
    this._lifecycle = new SdkInitLifeCycle(this.events, this.loadPriorityList, config.sdkInitializationTimeoutMs);
    this._lifecycle.setup(this);
  }

  /**
   * Initialize the SDK
   *
   * @param {Config} config The wallet configuration
   */
  public async initializeAsync(): Promise<RadarRelay<T>> {
    await this._ethereum.setProvider(this._walletType, this._config);

    // Allow access to web3 object
    this.web3 = this._ethereum.web3;

    await this.setEndpointOrThrowAsync();
    await this.getCallback(EventName.EthereumInitialized, this._ethereum);

    return this;
  }

  // --- Not user configurable below this line --- //

  private async initAccountAsync(address: string | number): Promise<string | boolean> {
    await this._ethereum.setDefaultAccount(address);
    this.account = new this._wallet({
      ethereum: this._ethereum,
      events: this.events,
      zeroEx: this.zeroEx,
      endpoint: this._config.radarRestEndpoint,
      tokens: this.tokens
    });
    return this.getCallback(EventName.AccountInitialized, this.account);
  }

  private async initEthereumNetworkIdAsync(): Promise<string | boolean> {
    this._networkId = await this._ethereum.getNetworkIdAsync.apply(this._ethereum);
    return this.getCallback(EventName.EthereumNetworkIdInitialized, this._networkId);
  }

  private initZeroEx(): Promise<string | boolean> {
    this.zeroEx = new ZeroEx(this._ethereum.web3.currentProvider, {
      networkId: this._networkId
    });
    return this.getCallback(EventName.ZeroExInitialized, this.zeroEx);
  }

  private initTrade(): Promise<string | boolean> {
    this._trade = new Trade<T>(this.zeroEx, this._config.radarRestEndpoint, this.account, this.events);
    return this.getCallback(EventName.TradeInitialized, this._trade);
  }

  private async initTokensAsync(): Promise<string | boolean> {
    // Only fetch if not already fetched
    if (this._prevApiEndpoint !== this._config.radarRestEndpoint) {
      const tokens: RadarToken[] = JSON.parse(await request.get(`${this._config.radarRestEndpoint}/tokens`));
      this.tokens = new LoadableMap({
        entries: tokens.map(token => [token.address, token]) as Array<[string, RadarToken]>,
      });
      tokens.map(token => this.tokens.set(token.address, token));
    }

    // TODO: index by address
    return this.getCallback(EventName.TokensInitialized, this.tokens);
  }

  private async initMarketsAsync(): Promise<string | boolean> {
    this.markets = new LoadableMap({
      getHandler: async ({ key }) => {
        const response = await request.get(`${this._config.radarRestEndpoint}/markets/${key}`);
        const market: RadarMarket = JSON.parse(response);
        return new Market(market, this._config.radarRestEndpoint, this._config.radarWebsocketEndpoint, this._trade);
      }
    });

    return this.getCallback(EventName.MarketsInitialized, this.markets);
  }

  private getCallback(event, data): Promise<string | boolean> {
    const callback = this._lifecycle.promise(event);
    this.events.emit(event, data);
    return callback;
  }

  private async setEndpointOrThrowAsync() {
    const walletConfig = this._config as InjectedWalletConfig;
    if (this._walletType === WalletType.Injected && !walletConfig.dataRpcUrl) {
      // Set Radar Relay API Endpoints if using injected provider
      const { radarRestEndpoint, radarWebsocketEndpoint } = RADAR_RELAY_ENDPOINTS(await this._ethereum.getNetworkIdAsync());
      this._config.radarRestEndpoint = radarRestEndpoint;
      this._config.radarWebsocketEndpoint = radarWebsocketEndpoint;
    }

    if (!this._config.radarRestEndpoint || !this._config.radarWebsocketEndpoint) {
      throw new Error(SdkError.InvalidOrMissingEndpoints);
    }
  }
}
