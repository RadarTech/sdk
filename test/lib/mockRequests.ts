import * as nock from 'nock';
import { Server } from 'mock-socket';
import { WebsocketEvent, WebsocketAction, RadarNewOrder, RadarSignedOrder } from '@radarrelay/types';
import BigNumber from 'bignumber.js';

export const RADAR_ENPOINT = 'http://localhost:8080/v2';
export const RADAR_WS_ENPOINT = 'wss://localhost:8081/v2'; // 'ws://ws.radarrelay.com';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

let mockServer;

// TODO more robust data + factories
export function mockRequests() {

  if (!mockServer) {
    mockServer = new Server(RADAR_WS_ENPOINT);
  }

  nock(RADAR_ENPOINT)
    .get('/tokens')
    .reply(200, [
      {
        address: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
        symbol: 'WETH',
        decimals: 18,
        name: 'Wrapped Ether',
        zeroex_official: 1,
        active: 1,
        quote: 1,
        deprecated: 0,
        createdDate: '2018-03-19T23:16:50.000Z'
      },
      {
        address: '0x34d402f14d58e001d8efbe6585051bf9706aa064',
        symbol: 'ZRX',
        decimals: 18,
        name: '0x Protocol Token',
        zeroex_official: 1,
        active: 1,
        quote: 0,
        deprecated: 0,
        createdDate: '2018-03-19T23:16:50.000Z'
      }
    ]);

  nock(RADAR_ENPOINT)
    .get('/markets/ZRX-WETH')
    .reply(200, {
      id: 'ZRX-WETH',
      displayName: 'ZRX/WETH',
      baseTokenAddress: '0x34d402f14d58e001d8efbe6585051bf9706aa064',
      quoteTokenAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
      baseTokenDecimals: 18,
      quoteTokenDecimals: 18,
      quoteIncrement: '0.00000001',
      minOrderSize: '1',
      maxOrderSize: '1'
    });

  nock(RADAR_ENPOINT)
    .get('/markets/ZRX-WETH/book')
    .reply(200, {
      baseTokenAddress: '0x34d402f14d58e001d8efbe6585051bf9706aa064',
      quoteTokenAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
      bids: [{}],
      asks: [{}]
    });

  nock(RADAR_ENPOINT)
    .get('/markets/ZRX-WETH/fills')
    .reply(200, [{}]);

  nock(RADAR_ENPOINT)
    .get('/markets/ZRX-WETH/candles')
    .reply(200, [{}]);

  nock(RADAR_ENPOINT)
    .get('/markets/ZRX-WETH/ticker')
    .reply(200, {
      transactionHash: '0xd78e7edb5e4feaf1b0236006d6918dc1f1167eeb842a3a3a044088416d475b1a', // last trade tx hash
      price: '0.0007', // last trade price
      size: '10', // last trade size (in quote)
      bid: '0.0007', // best bid
      ask: '0.00069', // best ask
      volume: '100', // 24hr volume of market in quote
      timestamp: '0.0007' // last trade time in unix time (seconds)
    });

  nock(RADAR_ENPOINT)
    .get('/markets/ZRX-WETH/stats')
    .reply(200, {
      numBidsWithinRange: 5, // Number of bids within a defined range (Example: Within 20% of the best bid)
      numAsksWithinRange: 3, // Number of asks within a defined range (Example: Within 20% of the best ask)
      baseTokenAvailable: '0', // Amount of base token available on the book
      quoteTokenAvailable: '0', // Amount of quote token available on the book
      volume24Hour: '0.00033727', // 24 hour volume
      percentChange24Hour: '0', // 24 hour price change percentage
    });

  nock(RADAR_ENPOINT)
    .get('/markets/ZRX-WETH/history')
    .reply(200, {
      price24Hour: [
        new BigNumber(0),
      ]
    });

  nock(RADAR_ENPOINT)
    .post('/markets/ZRX-WETH/order/limit', order => {
      return true;
    })
    .reply(200, {
      senderAddress: NULL_ADDRESS,
      makerAddress: 'SET',
      takerAddress: NULL_ADDRESS,
      makerFee: '0',
      takerFee: '0',
      makerAssetAmount: new BigNumber(10).pow(14).toString(),
      takerAssetAmount: new BigNumber(10).pow(14).toString(),
      makerAssetData: '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
      takerAssetData: '0xf47261b00000000000000000000000006ff6c0ff1d68b964901f986d4c9fa3ac68346570',
      salt: '1536516727297',
      exchangeAddress: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
      feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
      expirationTimeSeconds: '1536559895',
      signature: 'SET',
    });

  nock(RADAR_ENPOINT)
    .get('/accounts/0x5409ed021d9299bf6814279a6a1411a7e866a631/fills?page=1&perPage=100')
    .reply(200, [{}]);

  nock(RADAR_ENPOINT)
    .get('/accounts/0x5409ed021d9299bf6814279a6a1411a7e866a631/orders?page=1&perPage=100')
    .reply(200, [{}]);

  nock(RADAR_ENPOINT)
    .post('/orders', order => {
      // Send websocket event
      const newOrder: RadarNewOrder = {
        baseTokenAddress: '',
        quoteTokenAddress: '',
        order: order as RadarSignedOrder
      };
      const ev: WebsocketEvent = {
        action: WebsocketAction.NEW,
        event: newOrder
      };
      mockServer.send(JSON.stringify(ev));

      return true;
    }).reply(201);

  nock(RADAR_ENPOINT)
    .post('/markets/ZRX-WETH/order/market')
    .reply(200, {
      orders: [{
        exchangeAddress: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
        senderAddress: NULL_ADDRESS,
        makerAddress: '0x01901cd100a7c612594a7594fd50149a5eb3d309',
        takerAddress: NULL_ADDRESS,
        makerAssetData: '0xf47261b00000000000000000000000006ff6c0ff1d68b964901f986d4c9fa3ac68346570',
        takerAssetData: '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
        feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
        makerAssetAmount: '1000000000000000000',
        takerAssetAmount: '3100000000000000',
        makerFee: '0',
        takerFee: '0',
        expirationTimeSeconds: '1538924603',
        signature: '0x1bf82125462d93d7ed06a5160a8903f79152855bb2b78d56e0f3eb3098dfb61d7940c4c7d7ebe1a6aa5a9d102283e41d318753216e3de358bf1307adfec82d930103',
        salt: '1536332603630'
      }]
    });

}
