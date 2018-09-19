/* tslint:disable:no-unused-expression */
/* tslint:disable:no-implicit-dependencies */

import { SdkManager, RadarRelay, LocalAccount } from '../src';
import { mockRequests, RADAR_ENPOINT, RADAR_WS_ENPOINT } from './lib/mockRequests';
import * as chai from 'chai';
import BigNumber from 'bignumber.js';
import { UserOrderType, SignedOrder } from '@radarrelay/types';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

const expect = chai.expect;

describe('RadarRelay.Market', () => {

  let rrsdk: RadarRelay<LocalAccount>;
  let signedOrder: SignedOrder;
  let wethAddr;
  let zrxAddr;

  before(async () => {
    mockRequests();

    rrsdk = await SdkManager.SetupAndInitializeAsync({
      wallet: {
        password: 'password',
        seedPhrase: 'concert load couple harbor equip island argue ramp clarify fence smart topic'
      },
      dataRpcUrl: 'http://localhost:8545',
      radarRestEndpoint: RADAR_ENPOINT,
      radarWebsocketEndpoint: RADAR_WS_ENPOINT,
      defaultGasPrice: new BigNumber(2)
    });

    // set addr for later use
    const market = await rrsdk.markets.get('ZRX-WETH');
    zrxAddr = market.baseTokenAddress;
    wethAddr = market.quoteTokenAddress;

    // set allowance
    await rrsdk.account.setUnlimitedTokenAllowanceAsync(wethAddr, { awaitTransactionMined: true });
    await rrsdk.account.setUnlimitedTokenAllowanceAsync(zrxAddr, { awaitTransactionMined: true });
  });

  it('getBookAsync', async () => {
    const market = await rrsdk.markets.get('ZRX-WETH');
    const book = await market.getBookAsync();

    expect(book.bids.length).to.be.gt(0);
    expect(book.asks.length).to.be.gt(0);
  });

  it('getFillsAsync', async () => {
    const market = await rrsdk.markets.get('ZRX-WETH');
    const fills = await market.getFillsAsync();
    expect(fills.length).to.be.gt(0);
  });

  it('getCandlesAsync', async () => {
    const market = await rrsdk.markets.get('ZRX-WETH');
    const candles = await market.getCandlesAsync();
    expect(candles.length).to.be.gt(0);
  });

  it('getTickerAsync', async () => {
    // TODO local API returning 400
    const market = await rrsdk.markets.get('ZRX-WETH');
    const ticker = await market.getTickerAsync();
    expect(ticker).to.not.be.empty;
  });

  it('getStatsAsync', async () => {
    const market = await rrsdk.markets.get('ZRX-WETH');
    const stats = await market.getStatsAsync();
    expect(stats).to.not.be.empty;
  });

  it('getHistoryAsync', async () => {
    const market = await rrsdk.markets.get('ZRX-WETH');
    const stats = await market.getHistoryAsync();
    expect(stats).to.not.be.empty;
  });

  it.skip('limitOrderAsync', async () => {
    const market = await rrsdk.markets.get('ZRX-WETH');
    signedOrder = await market.limitOrderAsync(UserOrderType.BUY,
      new BigNumber(String(0.01)),
      new BigNumber('0.007'),
      new BigNumber((new Date().getTime() / 1000) + 43200).floor()
    );

    // verify valid signedOrder
    await rrsdk.zeroEx.exchange.validateOrderFillableOrThrowAsync(signedOrder);
  });

  it.skip('marketOrderAsync', async () => {
    await rrsdk.account.setUnlimitedTokenAllowanceAsync(
      wethAddr, { awaitTransactionMined: true }
    );
    const market = await rrsdk.markets.get('ZRX-WETH');
    const receipt = await market.marketOrderAsync(UserOrderType.BUY,
      new BigNumber(0.001), { awaitTransactionMined: true } // awaitTxMined
    );
    expect((receipt as TransactionReceiptWithDecodedLogs).status).to.be.eq(1);
  });

  it.skip('cancelOrderAsync', async () => {
    const market = await rrsdk.markets.get('ZRX-WETH');
    const receipt = await market.cancelOrderAsync(
      signedOrder, { awaitTransactionMined: true } // awaitTxMined
    );
    expect((receipt as TransactionReceiptWithDecodedLogs).status).to.be.eq(1);
    await rrsdk.zeroEx.exchange.validateOrderFillableOrThrowAsync(signedOrder);
  });

});
