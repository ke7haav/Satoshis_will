dfx stop

rm -rf .dfx

dfx start --clean --background


dfx deploy internet_identity


dfx deploy backend


cargo build --target wasm32-unknown-unknown --package backend


dfx generate backend

dfx generate internet_identity

# 5. Generate the environment variables (creates the .env file)
dfx generate