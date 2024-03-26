import "./App.css";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { PrimeSdk, isWalletProvider, EtherspotBundler, Web3eip1193WalletProvider, ArkaPaymaster } from "@etherspot/prime-sdk";
import { ethers } from "ethers";
import { useState } from "react";

function App() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [etherspotAddress, setEtherspotAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState(false);

  // Wait until the Privy client is ready before taking any actions
  if (!ready) {
    return null;
  }

  const mintNFT = async () => {
    const bundlerApiKey = "eyJvcmciOiI2NTIzZjY5MzUwOTBmNzAwMDFiYjJkZWIiLCJpZCI6IjMxMDZiOGY2NTRhZTRhZTM4MGVjYjJiN2Q2NDMzMjM4IiwiaCI6Im11cm11cjEyOCJ9";
    let primeSdk;
    if (ready && authenticated) {
      const privyProvider = await wallets[0].getWeb3jsProvider();
      const provider = privyProvider.walletProvider;
      let mappedProvider;
      if (!isWalletProvider(provider)) {
        try {
          // @ts-ignore
          mappedProvider = new Web3eip1193WalletProvider(provider);
          await mappedProvider.refresh();
        } catch (e) {
          // no need to log, this is an attempt
        }

        if (!mappedProvider) {
          throw new Error("Invalid provider!");
        }
      }
      primeSdk = new PrimeSdk(mappedProvider ?? provider, {
        chainId: 80001,
        bundlerProvider: new EtherspotBundler(80001, bundlerApiKey)
      });
    }

    // Get the Etherspot wallet address
    const walletAddress = await primeSdk.getCounterFactualAddress();
    setEtherspotAddress(walletAddress);
    // Whitelist Etherspot address
    const arka_api_key = 'arka_public_key';
    const arka_url = 'https://arka.etherspot.io';
    const arkaPaymaster = new ArkaPaymaster(80001, arka_api_key, arka_url);

    if((await arkaPaymaster.checkWhitelist(String(walletAddress))) !== "Already added") {
      await arkaPaymaster.addWhitelist([walletAddress]);
    }

    // clear the transaction batch
    await primeSdk.clearUserOpsFromBatch();

    // get NFT contract interface
    const erc1155Interface = new ethers.utils.Interface([
      "function mint(address _targetAddress)",
    ]);

    // encode function data 
    const erc1155Data = erc1155Interface.encodeFunctionData("mint", [walletAddress]);

    // add transaction to the batch
    await primeSdk.addUserOpsToBatch({
      to: "0xA3B5AECA6D4B3bD409d4163FD6FB5e5CeE2747F9",
      data: erc1155Data,
    });

    // estimate transaction 
    const estimation = await primeSdk.estimate({
      paymasterDetails: {
        url: `https://arka.etherspot.io?apiKey=arka_public_key&chainId=80001`,
        context: { mode: "sponsor" },
      },
    });

    // sign the UserOp and submit to bundler
    const uoHash = await primeSdk.send(estimation);
  
    // wait for transaction to be included on chain
    let userOpsReceipt = null;
    const timeout = Date.now() + 60000; // 1 minute timeout
    while (userOpsReceipt == null && Date.now() < timeout) {
      userOpsReceipt = await primeSdk.getUserOpReceipt(uoHash);
    }

    console.log('\x1b[33m%s\x1b[0m', `Transaction Receipt: `, userOpsReceipt);
    setTransactionHash(userOpsReceipt.receipt.transactionHash);
  };

  return (
    <div className="App">
      <header className="App-header">
        {ready && authenticated ? (
          <div>
            <button onClick={logout}>Log Out of Privy</button>
          </div>
        ) : (
          <button onClick={login}>Log In with Privy</button>
        )}
        <div>
          <button onClick={mintNFT}>Mint NFT</button>
          {etherspotAddress ? (
            <div>
            <br/>
            Minting NFT to {etherspotAddress}   
            </div>
          ) : (
            <div></div>
          )}
        </div>

        {transactionHash ? (
          <div>
            <a
              target="_blank"
              href={`https://mumbai.polygonscan.com/tx/${transactionHash}`}
            >
            NFT Minted! Click here to view the transaction.
            </a>
          </div>
        ) : (
          <div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;