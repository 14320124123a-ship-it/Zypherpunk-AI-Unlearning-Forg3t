\# Zcash node config for Forg3t



This folder contains configuration files for running a Zcash node used by the Forg3t project.



\- `zcash.conf.testnet`  Zcash testnet configuration

\- `zcash.conf.regtest`  Local regtest configuration (optional)



\## How to use on Linux



Copy the desired config to the Zcash data directory and start zcashd:



```bash

mkdir -p ~/.zcash

cp /mnt/c/Users/Alvinn/Desktop/"Forg3t MVP Zcash --"/project/backend-service/onchain/zcash-node/zcash.conf.testnet ~/.zcash/zcash.conf

zcashd



