import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Define the target testnet (Sepolia)
const TARGET_CHAIN_ID = '0xaa36a7'; // 11155111 in hexadecimal
const TARGET_NETWORK_NAME = 'Sepolia';

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState(null);

  const getEthereumObject = () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.error("MetaMask not detected!");
      setError("MetaMask not detected. Please install MetaMask.");
      return null;
    }
    return ethereum;
  };

  const clearState = useCallback(() => {
      setProvider(null);
      setSigner(null);
      setAccount(null);
      setBalance(null);
      setIsConnected(false);
      setNetwork(null);
      // Keep the error message if it's relevant (like "switch network")
      // setError(null);
      console.log("Wallet state cleared");
  }, []);


  const switchToTargetNetwork = useCallback(async (ethereum) => {
      try {
          await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: TARGET_CHAIN_ID }],
          });
          // Success! The 'chainChanged' event will trigger reconnection logic.
          setError(null); // Clear previous errors
          return true;
      } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
              setError(`Network ${TARGET_NETWORK_NAME} not found in MetaMask. Please add it manually.`);
              // TODO: Optionally add 'wallet_addEthereumChain' logic here
          } else if (switchError.code === 4001) {
              setError("Network switch request rejected by user.");
          } else {
              setError(`Failed to switch network: ${switchError.message}`);
          }
          console.error("Failed to switch network", switchError);
          clearState(); // Clear connection state if switch fails
          setIsConnected(false); // Ensure disconnected state
          return false;
      }
  }, [clearState]);


   const updateBalance = useCallback(async (currentAccount, web3Provider) => {
      if (!currentAccount || !web3Provider) return;
      try {
        const weiBalance = await web3Provider.getBalance(currentAccount);
        setBalance(ethers.formatEther(weiBalance));
      } catch (balanceError) {
        console.error("Error fetching balance:", balanceError);
        // Don't set main error, maybe show a specific balance error if needed
      }
   }, []);


  const connectWallet = useCallback(async () => {
    setError(null); // Clear previous errors on new connection attempt
    const ethereum = getEthereumObject();
    if (!ethereum) return;

    try {
      // 1. Request Accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setError("No authorized account found.");
        clearState();
        return;
      }
      const currentAccount = accounts[0];

      // 2. Setup Provider
      const web3Provider = new ethers.BrowserProvider(ethereum);
      setProvider(web3Provider); // Set provider early for network check

      // 3. Check Network
      const currentNetwork = await web3Provider.getNetwork();
      const currentChainId = `0x${currentNetwork.chainId.toString(16)}`;

      if (currentChainId !== TARGET_CHAIN_ID) {
        setError(`Please switch to the ${TARGET_NETWORK_NAME} network.`);
        const switched = await switchToTargetNetwork(ethereum);
        // If switch fails or is rejected, stop the connection process here.
        // The 'chainChanged' event will handle successful switches.
        if (!switched) {
            // Error is already set by switchToTargetNetwork
            clearState(); // Ensure state is cleared
            setIsConnected(false);
            return;
        }
        // If switch was successful, the chainChanged event listener below
        // will likely trigger a re-run of connectWallet, so we can potentially
        // return here. However, let's proceed to set state for immediate feedback
        // assuming the switch worked and chainChanged might have a slight delay.
        // Re-fetch network info after potential switch
         const updatedNetwork = await web3Provider.getNetwork();
         if (`0x${updatedNetwork.chainId.toString(16)}` !== TARGET_CHAIN_ID) {
             // Should not happen if switch succeeded, but as a safeguard
             setError(`Failed to verify network switch. Please connect to ${TARGET_NETWORK_NAME}.`);
             clearState();
             setIsConnected(false);
             return;
         }
         setNetwork(updatedNetwork); // Set the correct network info
      } else {
         setNetwork(currentNetwork); // Already on the correct network
      }

      // 4. Set Account and Signer (only if on correct network)
      setAccount(currentAccount);
      const currentSigner = await web3Provider.getSigner();
      setSigner(currentSigner);

      // 5. Set Connected State and Fetch Balance
      setIsConnected(true);
      setError(null); // Clear any "switch network" prompts if successful
      await updateBalance(currentAccount, web3Provider);
      console.log(`Connected to ${TARGET_NETWORK_NAME} with account: ${currentAccount}`);


    } catch (err) {
      console.error("Error connecting wallet:", err);
       if (err.code === 4001) {
         setError("Connection request rejected.");
       } else if (err.message.includes("disconnected")) {
         setError("Wallet disconnected during connection.");
       }
       else {
         setError(`Connection error: ${err.message}`);
       }
      clearState();
      setIsConnected(false);
    }
  }, [updateBalance, clearState, switchToTargetNetwork]); // Add dependencies

  // Listener setup remains largely the same
  useEffect(() => {
    const ethereum = getEthereumObject();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        setError("Wallet disconnected or locked.");
        clearState();
        setIsConnected(false);
      } else if (accounts[0] !== account) {
        // Account changed, re-run connection logic
         connectWallet();
      }
    };

    const handleChainChanged = (_chainId) => {
       console.log("Network changed:", _chainId);
       // Chain changed, always re-run connection logic to verify network and update state
       connectWallet();
    };

     const handleDisconnect = (error) => {
        console.error("Wallet disconnected event:", error);
        setError("Wallet disconnected.");
        clearState();
        setIsConnected(false);
     };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    if (ethereum.on) {
        ethereum.on('disconnect', handleDisconnect);
    }

    // Optional: Check connection status on initial load
    // const checkInitialConnection = async () => {
    //    if (ethereum.isConnected && ethereum.selectedAddress) {
    //        console.log("Attempting to restore connection state on load...");
    //        await connectWallet();
    //    }
    // };
    // checkInitialConnection();


    return () => {
      if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
    // Ensure account is a dependency if used in checkInitialConnection or similar logic
  }, [account, connectWallet, clearState]);

  // Balance update effect remains the same
   useEffect(() => {
     let intervalId;
     if (isConnected && account && provider) {
       updateBalance(account, provider);
       intervalId = setInterval(() => {
         updateBalance(account, provider);
       }, 30000);
     }
     return () => clearInterval(intervalId);
   }, [isConnected, account, provider, updateBalance]);


  return {
    provider,
    signer,
    account,
    balance,
    isConnected,
    network,
    error,
    connectWallet,
    // No need to expose disconnectWallet externally if clearState handles it internally
    // disconnectWallet: clearState,
    updateBalance
  };
}
