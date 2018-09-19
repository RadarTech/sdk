export interface LoadableMapConfig<KeyType, ValueType> {
    getHandler?: LoadableMap<KeyType, ValueType>['_getHandler'];
    setHandler?: LoadableMap<KeyType, ValueType>['_setHandler'];
    deleteHandler?: LoadableMap<KeyType, ValueType>['_deleteHandler'];
    entries?: ReadonlyArray<[KeyType, ValueType]>;
}
export declare class LoadableMap<KeyType, ValueType> implements Iterable<[KeyType, ValueType]> {
    private _data;
    private _getHandler;
    private _setHandler;
    private _deleteHandler;
    size: Map<KeyType, ValueType>['size'];
    clear: Map<KeyType, ValueType>['clear'];
    entries: Map<KeyType, ValueType>['entries'];
    forEach: Map<KeyType, ValueType>['forEach'];
    keys: Map<KeyType, ValueType>['keys'];
    values: Map<KeyType, ValueType>['values'];
    nativeHas: Map<KeyType, ValueType>['has'];
    nativeGet: Map<KeyType, ValueType>['get'];
    nativeSet: Map<KeyType, ValueType>['set'];
    nativeDelete: Map<KeyType, ValueType>['delete'];
    constructor(config?: LoadableMapConfig<KeyType, ValueType>);
    /**
     * Checks if the entry at the specified key exists, cross-checked against the
     * asynchronous `getHandler` callback passed into the instance configuration.
     *
     * @param key The key to verify for entries at.
     */
    has(key: KeyType): Promise<boolean>;
    /**
     * Gets the entry at the specified key, cross-checked against the asynchronous
     * `getHandler` callback passed into the instance configuration.
     *
     * @param key The entry key to retrieve.
     */
    get(key: KeyType): Promise<ValueType>;
    /**
     * Sets an entry value at the specified key if the asynchronous `setHandler`
     * callback passed into the instance configuration returns truthy.
     *
     * @param key The entry key to set.
     * @param value The value to set.
     */
    set(key: KeyType, value: ValueType): Promise<this>;
    /**
     * Deletes an entry value at the specified key if the asynchronous callback
     * `deleteHandler` callback passed into the instance configuration returns
     * truthy.
     *
     * @param key The entry key to delete.
     */
    delete(key: KeyType): Promise<boolean>;
    [Symbol.iterator](): IterableIterator<any>;
}
