/* tslint:disable:no-unused-expression */
/* tslint:disable:no-implicit-dependencies */

import * as chai from 'chai';
import { SdkManager, RadarRelay, LocalAccount } from '../src';
import { mockRequests, RADAR_ENPOINT, RADAR_WS_ENPOINT } from './lib/mockRequests';
import BigNumber from 'bignumber.js';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-protocol';

const expect = chai.expect;

describe('RadarRelay.Account', () => {

  let rrsdk: RadarRelay<LocalAccount>;
  let wethAddr;
  let zrxAddr;
  let addresses;

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
    });

      // set addr for later use
      const market = await rrsdk.markets.get('ZRX-WETH');
      zrxAddr = market.baseTokenAddress;
      wethAddr = market.quoteTokenAddress;

      // get available addresses
      addresses = await rrsdk.account.getAvailableAddressesAsync();
      if (addresses.length === 1) {
        rrsdk.account.addNewAddresses(1);
        addresses = await rrsdk.account.getAvailableAddressesAsync();
      }
      console.log('[addresses]', addresses);
  });

  it('getOrdersAsync', async () => {
    const orders = await rrsdk.account.getOrdersAsync();
    expect(orders.length).to.be.gt(0);
  });

  it('getFillsAsync', async () => {
    const fills = await rrsdk.account.getFillsAsync();
    expect(fills.length).to.be.gt(0);
  });

  it('getEthBalanceAsync', async () => {
    const balance = await rrsdk.account.getEthBalanceAsync();

    console.log('[eth balance]', balance.toNumber());
    expect(balance.toNumber()).to.be.gt(0);
  });

  it('transferEthAsync', async () => {
    const receipt = await rrsdk.account.transferEthAsync(
      addresses[1], new BigNumber('0.01'), { awaitTransactionMined: true }
    );
    expect((receipt as TransactionReceiptWithDecodedLogs).status).to.be.eq(1);
    await rrsdk.account.setAddressAsync(addresses[1]);
    const balance = await rrsdk.account.getEthBalanceAsync();
    expect(balance.toNumber()).to.be.gt(0);
  });

  it('wrapEthAsync', async () => {
    const receipt = await rrsdk.account.wrapEthAsync(
      new BigNumber('0.02'), { awaitTransactionMined: true } // await
    );
    expect((receipt as TransactionReceiptWithDecodedLogs).status).to.be.eq(1);
    const wethBal = await rrsdk.account.getTokenBalanceAsync(wethAddr);
    expect(wethBal.toNumber()).to.be.gt(0);
  });

  // TODO running into out of gas on testrpc
  it('unwrapEthAsync', async () => {
    const wethBal = await rrsdk.account.getTokenBalanceAsync(wethAddr);
    const receipt = await rrsdk.account.unwrapEthAsync(
      wethBal.minus(new BigNumber('0.01')), {
        awaitTransactionMined: true,
        transactionOpts: { gasLimit: 4000000 } // TODO required on testrpc?
      }
    );
    expect((receipt as TransactionReceiptWithDecodedLogs).status).to.be.eq(1);
    const wethBalAfter = await rrsdk.account.getTokenBalanceAsync(wethAddr);
    expect(wethBalAfter.toString()).to.be.equal('0.01');
  });

  it('getTokenBalanceAsync', async () => {
    const balance = await rrsdk.account.getTokenBalanceAsync(wethAddr);
    expect(balance.toNumber()).to.be.gt(0);
  });

  it('setUnlimitedTokenAllowanceAsync', async () => {
    const wethReceipt = await rrsdk.account.setUnlimitedTokenAllowanceAsync(
      wethAddr, { awaitTransactionMined: true }
    );
    expect((wethReceipt as TransactionReceiptWithDecodedLogs).status).to.be.eq(1);
    const zrxReceipt = await rrsdk.account.setUnlimitedTokenAllowanceAsync(
      zrxAddr, { awaitTransactionMined: true }
    );
    expect((zrxReceipt as TransactionReceiptWithDecodedLogs).status).to.be.eq(1);
  });

  it('getTokenAllowanceAsync', async () => {
    const allowance = await rrsdk.account.getTokenAllowanceAsync(
      wethAddr
    );
    expect(allowance.toNumber()).to.be.gt(0);
  });

  it('transferTokenAsync', async () => {
    const hash = await rrsdk.account.transferTokenAsync(
      wethAddr,
      addresses[1],
      new BigNumber('0.01'), {
        awaitTransactionMined: true,
        transactionOpts: { gasLimit: 4000000 } // TODO required on testrpc?
      }
    );

    await rrsdk.account.setAddressAsync(addresses[1]);
    const balance = await rrsdk.account.getTokenBalanceAsync(wethAddr);
    expect(balance.toNumber()).to.be.gt(0);
  });

  it.skip('setTokenAllowanceAsync', async () => {
    // TODO
  });

});
