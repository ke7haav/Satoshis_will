export const idlFactory = ({ IDL }) => {
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'testnet' : IDL.Null,
  });
  const InheritanceInfo = IDL.Record({
    'is_expired' : IDL.Bool,
    'beneficiary_btc_address' : IDL.Text,
    'last_active' : IDL.Nat64,
    'heartbeat_seconds' : IDL.Nat64,
    'time_remaining' : IDL.Nat64,
    'owner_principal' : IDL.Principal,
  });
  const WillStatus = IDL.Record({
    'last_active' : IDL.Nat64,
    'heartbeat_seconds' : IDL.Nat64,
  });
  const VetkdDeriveEncryptedKeyArgs = IDL.Record({
    'encryption_public_key' : IDL.Vec(IDL.Nat8),
    'public_key_derivation_path' : IDL.Vec(IDL.Vec(IDL.Nat8)),
  });
  const VetkdEncryptedKeyReply = IDL.Record({
    'encrypted_key' : IDL.Vec(IDL.Nat8),
  });
  return IDL.Service({
    'claim_inheritance' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Vec(IDL.Nat8), 'Err' : IDL.Text })],
        [],
      ),
    'get_my_inheritances' : IDL.Func([], [IDL.Vec(InheritanceInfo)], []),
    'get_vault_balance' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'get_vault_btc_address' : IDL.Func([], [IDL.Text], []),
    'get_vault_ckbtc_balance' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : IDL.Text })],
        [],
      ),
    'get_will_status' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : WillStatus, 'Err' : IDL.Text })],
        [],
      ),
    'i_am_alive' : IDL.Func([], [], []),
    'register_will' : IDL.Func(
        [IDL.Principal, IDL.Text, IDL.Nat64, IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'store_encrypted_secret' : IDL.Func([IDL.Vec(IDL.Nat8)], [], []),
    'vetkd_derive_encrypted_key' : IDL.Func(
        [VetkdDeriveEncryptedKeyArgs],
        [IDL.Variant({ 'Ok' : VetkdEncryptedKeyReply, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => {
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'testnet' : IDL.Null,
  });
  return [BitcoinNetwork];
};
