import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type BitcoinNetwork = { 'mainnet' : null } |
  { 'testnet' : null };
export interface InheritanceInfo {
  'is_expired' : boolean,
  'beneficiary_btc_address' : string,
  'last_active' : bigint,
  'heartbeat_seconds' : bigint,
  'time_remaining' : bigint,
  'owner_principal' : Principal,
}
export interface VetkdDeriveEncryptedKeyArgs {
  'encryption_public_key' : Uint8Array | number[],
  'public_key_derivation_path' : Array<Uint8Array | number[]>,
}
export interface VetkdEncryptedKeyReply {
  'encrypted_key' : Uint8Array | number[],
}
export interface WillStatus {
  'last_active' : bigint,
  'heartbeat_seconds' : bigint,
}
export interface _SERVICE {
  'claim_inheritance' : ActorMethod<
    [Principal],
    { 'Ok' : Uint8Array | number[] } |
      { 'Err' : string }
  >,
  'get_my_inheritances' : ActorMethod<[], Array<InheritanceInfo>>,
  'get_vault_btc_address' : ActorMethod<[], string>,
  'get_will_status' : ActorMethod<
    [],
    { 'Ok' : WillStatus } |
      { 'Err' : string }
  >,
  'i_am_alive' : ActorMethod<[], undefined>,
  'register_will' : ActorMethod<
    [Principal, string, bigint, Uint8Array | number[]],
    string
  >,
  'store_encrypted_secret' : ActorMethod<[Uint8Array | number[]], undefined>,
  'vetkd_derive_encrypted_key' : ActorMethod<
    [VetkdDeriveEncryptedKeyArgs],
    { 'Ok' : VetkdEncryptedKeyReply } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
