export interface LoadableMapConfig<KeyType, ValueType> {
  getHandler?: LoadableMap<KeyType, ValueType>['_getHandler'];
  setHandler?: LoadableMap<KeyType, ValueType>['_setHandler'];
  deleteHandler?: LoadableMap<KeyType, ValueType>['_deleteHandler'];
  entries?: ReadonlyArray<[KeyType, ValueType]>;
}

export class LoadableMap<KeyType, ValueType> implements Iterable<[KeyType, ValueType]> {

  // --- Properties --- //

  private _data: Map<KeyType, ValueType>; // Internal ES6 Map object
  private _getHandler: ({ key }: { key: KeyType }) => Promise<ValueType>;
  private _setHandler: ({ key, value }: { key: KeyType, value: ValueType }) => Promise<boolean>;
  private _deleteHandler: ({ key }: { key: KeyType }) => Promise<boolean>;

  // Mock native ES6 Map properties and methods
  public size: Map<KeyType, ValueType>['size'];
  public clear: Map<KeyType, ValueType>['clear'];
  public entries: Map<KeyType, ValueType>['entries'];
  public forEach: Map<KeyType, ValueType>['forEach'];
  public keys: Map<KeyType, ValueType>['keys'];
  public values: Map<KeyType, ValueType>['values'];
  public nativeHas: Map<KeyType, ValueType>['has'];
  public nativeGet: Map<KeyType, ValueType>['get'];
  public nativeSet: Map<KeyType, ValueType>['set'];
  public nativeDelete: Map<KeyType, ValueType>['delete'];

  constructor(config: LoadableMapConfig<KeyType, ValueType> = {}) {
    this._data = new Map();

    // Mock native ES6 Map `get` and `set` methods.
    this.nativeHas = this._data.has.bind(this._data);
    this.nativeGet = this._data.get.bind(this._data);
    this.nativeSet = this._data.set.bind(this._data);
    this.nativeDelete = this._data.delete.bind(this._data);

    this._getHandler = config.getHandler || (async ({ key }) => this.nativeGet(key));
    this._setHandler = config.setHandler || (async () => true);
    this._deleteHandler = config.deleteHandler || (async () => true);

    const proxyHandler: ProxyHandler<this> = {
      get: (target, prop) => {
        if (!target[prop]) {

          // If a method is being accessed, return the bound ES6 Map method.
          if (
            prop === Symbol.iterator ||
            typeof this._data[prop] === 'function'
          ) return this._data[prop].bind(this._data);

          // Else, return the ES6 Map property.
          return this._data[prop];

        }

        return Reflect.get(target, prop);
      }
    };

    const proxy = new Proxy(this, proxyHandler);

    // Add initial entries
    if (config.entries) {
      for (const [key, value] of config.entries) {
        proxy.set(key as any, value);
      }
    }

    return proxy;
  }

  /**
   * Checks if the entry at the specified key exists, cross-checked against the
   * asynchronous `getHandler` callback passed into the instance configuration.
   *
   * @param key The key to verify for entries at.
   */
  public async has(key: KeyType) {
    if (!this.nativeHas(key)) {
      try {
        const data = await this._getHandler({ key });
        if (data) this.nativeSet(key, data);
      } catch (e) {
        return false;
      }
    }

    return this.nativeHas(key);
  }

  /**
   * Gets the entry at the specified key, cross-checked against the asynchronous
   * `getHandler` callback passed into the instance configuration.
   *
   * @param key The entry key to retrieve.
   */
  public async get(key: KeyType) {
    await this.has(key);
    return this.nativeGet(key);
  }

  /**
   * Sets an entry value at the specified key if the asynchronous `setHandler`
   * callback passed into the instance configuration returns truthy.
   *
   * @param key The entry key to set.
   * @param value The value to set.
   */
  public async set(key: KeyType, value: ValueType) {
    try {
      const shouldSet = await this._setHandler({ key, value });
      if (shouldSet) this.nativeSet(key, value);
    } catch (e) {
      throw e;
    }
    return this;
  }

  /**
   * Deletes an entry value at the specified key if the asynchronous callback
   * `deleteHandler` callback passed into the instance configuration returns
   * truthy.
   *
   * @param key The entry key to delete.
   */
  public async delete(key: KeyType) {
    try {
      const shouldDelete = await this._deleteHandler({ key });
      if (shouldDelete) this.nativeDelete(key);
    } catch (e) {
      throw e;
    }
    return !this.nativeHas(key);
  }

  // Mock ES6 iterable
  public *[Symbol.iterator]() { return; }
}
