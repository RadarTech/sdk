// Vendor
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import {
  Provider,
  ContractWrappers,
  ContractWrappersConfig,
  ExchangeWrapper,
  EtherTokenWrapper,
  ERC20TokenWrapper,
  ERC20ProxyWrapper,
  Order,
  SignedOrder,
  SignerType,
  ERC721TokenWrapper,
  BlockParamLiteral,
  orderHashUtils,
  signatureUtils,
} from '0x.js';
import {
  OrderValidationUtils,
  ExchangeTransferSimulator,
  BalanceAndProxyAllowanceLazyStore,
} from '@0xproject/order-utils';
import BigNumber from 'bignumber.js';

// Internal
import { OrderFilledCancelledFetcher } from './validation/order-filled-cancelled-fetcher';
import { AssetBalanceAndProxyAllowanceFetcher } from './validation/asset-balance-and-proxy-allowance-fetcher';

export class ZeroEx {

  // --- Properties --- //

  public exchange: ExchangeWrapper;
  public erc20Token: ERC20TokenWrapper;
  public etherToken: EtherTokenWrapper;
  public erc20Proxy: ERC20ProxyWrapper;
  public erc721Token: ERC721TokenWrapper;

  private readonly _provider: Provider;
  private readonly _contractWrappers: ContractWrappers;
  private readonly _web3WrapperInstance: Web3Wrapper;
  private readonly _exchangeContractAddress: string;
  private readonly _zrxAssetData: string;
  private readonly _orderValidationUtils: OrderValidationUtils;
  private readonly _exchangeTransferSimulator: ExchangeTransferSimulator;

  constructor(
    provider: Provider,
    config: ContractWrappersConfig,
  ) {

    this._provider = provider;
    this._web3WrapperInstance = new Web3Wrapper(provider);

    // Create contract wrappers
    this._contractWrappers = new ContractWrappers(provider, config);
    this.exchange = this._contractWrappers.exchange;
    this.erc20Proxy = this._contractWrappers.erc20Proxy;
    this.erc20Token = this._contractWrappers.erc20Token;
    this.erc721Token = this._contractWrappers.erc721Token;
    this.etherToken = this._contractWrappers.etherToken;

    // Set contract address
    this._exchangeContractAddress = this.exchange.getContractAddress();

    // Create order validation utils
    this._zrxAssetData = this.exchange.getZRXAssetData();
    const simpleOrderFilledCancelledFetcher = new OrderFilledCancelledFetcher(this.exchange, BlockParamLiteral.Latest);
    this._orderValidationUtils = new OrderValidationUtils(simpleOrderFilledCancelledFetcher);
    const assetBalanceAndProxyAllowanceFetcher = new AssetBalanceAndProxyAllowanceFetcher(
      this.erc20Token,
      this.erc721Token,
      BlockParamLiteral.Latest
    );
    const balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(
      assetBalanceAndProxyAllowanceFetcher
    );
    this._exchangeTransferSimulator = new ExchangeTransferSimulator(balanceAndProxyAllowanceLazyStore);
  }

  /**
   * When creating an order without a specified taker or feeRecipient you must supply the Solidity
   * address null type (as opposed to Javascripts `null`, `undefined` or empty string). We expose
   * this constant for your convenience.
   */
  public static NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

  /**
   * Get exchange contract address
   * @public
   * @return string  The exchange contract address
   */
  public getExchangeContractAddress(): string {
    return this._exchangeContractAddress;
  }

  /**
   * A unit amount is defined as the amount of a token above the specified decimal places (integer part).
   * E.g: If a currency has 18 decimal places, 1e18 or one quintillion of the currency is equivalent
   * to 1 unit.
   * @param   amount      The amount in baseUnits that you would like converted to units.
   * @param   decimals    The number of decimal places the unit amount has.
   * @return  The amount in units.
   */
  public static toUnitAmount(amount: BigNumber, decimals: number): BigNumber {
    const unitAmount = Web3Wrapper.toUnitAmount(amount, decimals);
    return unitAmount;
  }

  /**
   * Convert to Base Unit Amount
   * A baseUnit is defined as the smallest denomination of a token. An amount expressed in baseUnits
   * is the amount expressed in the smallest denomination.
   * E.g: 1 unit of a token with 18 decimal places is expressed in baseUnits as 1000000000000000000
   * @param   amount      The amount of units that you would like converted to baseUnits.
   * @param   decimals    The number of decimal places the unit amount has.
   * @return  The amount in baseUnits.
   */
  public static toBaseUnitAmount(amount: BigNumber, decimals: number): BigNumber {
    return Web3Wrapper.toBaseUnitAmount(amount, decimals);
  }

  /**
   * Computes the orderHash for a supplied order.
   * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
   * @return  The resulting orderHash from hashing the supplied order.
   */
  public static getOrderHashHex(order: Order | SignedOrder): string {
    return orderHashUtils.getOrderHashHex(order);
  }

  /**
   * Returns the current timestamp in milliseconds, which is used for the salt.
   * The salt can be included in a 0x order. This ensures that the order generates
   * a unique orderHash and allows orders to be canceled using CancelUpTo.
   */
  public static generateSaltTimestamp(): BigNumber {
    return new BigNumber(Date.now());
  }

  /**
   * Waits for a transaction to be mined and returns the transaction receipt.
   * Note that just because a transaction was mined does not mean it was
   * successful. You need to check the status code of the transaction receipt
   * to find out if it was successful, or use the helper method
   * awaitTransactionSuccessAsync.
   * @param   txHash            Transaction hash
   * @param   pollingIntervalMs How often (in ms) should we check if the transaction is mined.
   * @param   timeoutMs         How long (in ms) to poll for transaction mined until aborting.
   * @return  Transaction receipt with decoded log args.
   */
  public async awaitTransactionMinedAsync(txHash: string, pollingInterval?: number, timeoutMs?: number) {
    return this._web3WrapperInstance.awaitTransactionMinedAsync(txHash, pollingInterval, timeoutMs);
  }

  /**
   * Retrieves the transaction receipt for a given transaction hash
   * @param txHash Transaction hash
   * @returns The transaction receipt, including it's status (0: failed, 1: succeeded or undefined: not found)
   */
  public async getTransactionReceiptAsync(txHash: string) {
    return this._web3WrapperInstance.getTransactionReceiptAsync(txHash);
  }

  /**
   * Signs an orderHash and returns it's elliptic curve signature and signature type.
   * This method currently supports TestRPC, Geth and Parity above and below V1.6.6
   * @param   orderHash       Hex encoded orderHash to sign.
   * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
   *          must be available via the Provider supplied to 0x.js.
   * @param   signerType Different signers add/require different prefixes to be prepended to the message being signed.
   *          Since we cannot know ahead of time which signer you are using, you must supply a SignerType.
   * @return  A hex encoded string containing the Elliptic curve signature generated by signing the orderHash and the Signature Type.
   */
  public async ecSignOrderHashAsync(
      orderHash: string,
      signerAddress: string,
      signerType: SignerType,
  ): Promise<string> {
      return signatureUtils.ecSignOrderHashAsync(
        this._provider,
        orderHash,
        signerAddress,
        signerType,
      );
  }

  /**
   * Validate that a signed order is fillable or throw
   * @param signedOrder The signed order to validate
   */
  public async validateOrderFillableOrThrowAsync(signedOrder: SignedOrder) {
    return this._orderValidationUtils.validateOrderFillableOrThrowAsync(
      this._exchangeTransferSimulator,
      signedOrder,
      this._zrxAssetData
    );
  }
}
