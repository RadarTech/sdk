/* tslint:disable:no-unused-expression */
/* tslint:disable:no-implicit-dependencies */

import { ZeroEx } from '../src/ZeroEx';
import * as mocha from 'mocha';
import * as chai from 'chai';
import { SdkManager, RadarRelay, LocalAccount } from '../src';
import { WebsocketRequestTopic, UserOrderType } from '@radarrelay/types';
import { mockRequests } from './lib/mockRequests';
import BigNumber from 'bignumber.js';
import { WebSocket } from 'mock-socket';

const expect = chai.expect;

describe.skip('RadarRelay.Ws', () => {

  let rrsdk: RadarRelay<LocalAccount>;
  let order;

  before(async () => {
    mockRequests();

    rrsdk = await SdkManager.SetupAndInitializeAsync({
      wallet: {
        password: 'password'
      },
      dataRpcUrl: 'https://kovan.infura.io',
      radarRestEndpoint: 'https://api.kovan.radarrelay.com/v2',
      radarWebsocketEndpoint: 'wss://ws.kovan.radarrelay.com/v2'
    });
  });

  // TODO need to overwrite socket with mock-socket
  it('fires event on order create', async () => {

    await new Promise(async (resolve, reject) => {

      const zrxWethMarket = await rrsdk.markets.get('ZRX-WETH');

      const subscription = await zrxWethMarket.subscribeAsync(WebsocketRequestTopic.BOOK, mssg => {
        console.log(mssg);
        if (mssg.action === 'NEW') {
          resolve();
        }
      });

      order = await zrxWethMarket.limitOrderAsync(UserOrderType.BUY,
        new BigNumber(String(Math.random() * 10)),
        new BigNumber('0.0015'),
        new BigNumber((new Date().getTime() / 1000) + 43200).floor()
      );

      // subscription.unsubscribe();

    });

  });

});
