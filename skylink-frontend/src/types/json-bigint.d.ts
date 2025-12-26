declare module 'json-bigint' {
  type JSONBigFactoryOptions = {
    storeAsString?: boolean;
    strict?: boolean;
    useNativeBigInt?: boolean;
    alwaysParseAsBig?: boolean;
    protoAction?: 'error' | 'ignore' | 'preserve';
    constructorAction?: 'error' | 'ignore' | 'preserve';
  };

  type JSONBigLike = {
    parse(text: string): any;
    stringify(value: any, replacer?: any, space?: string | number): string;
  };

  function JSONBigFactory(options?: JSONBigFactoryOptions): JSONBigLike;

  export default JSONBigFactory;
}
