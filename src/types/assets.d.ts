declare module "*.json" {
  import type { Abi } from "viem";

  const value: Abi;
  export default value;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";
declare module "*.webp";
