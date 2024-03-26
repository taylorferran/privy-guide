import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { PrivyProvider } from '@privy-io/react-auth';

export const polygonMumbai = {
  id: 80_001,
  name: 'Polygon Mumbai',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/polygon_mumbai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com',
      apiUrl: 'https://mumbai.polygonscan.com/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 25770160,
    },
  },
  testnet: true,
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrivyProvider
      appId={"clpispdty00ycl80fpueukbhl"}
      onSuccess={(user) => console.log(`User ${user.id} logged in!`)}
      createPrivyWalletOnLogin={true}
      config={{
        defaultChain: polygonMumbai,
        supportedChains: [polygonMumbai],
        loginMethods: ['wallet', 'email', 'google', 'twitter'],
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
          logo: "https://mintlify.s3-us-west-1.amazonaws.com/etherspot/logo/dark.png",
          showWalletLoginFirst: false,
        }
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);