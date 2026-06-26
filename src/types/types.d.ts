export type ABIMap = Record<string, string[]>;

export type ENSResult = {
  batchId: string;
  domain: string;
  address: string | null | undefined;
  expiry: number;
};
