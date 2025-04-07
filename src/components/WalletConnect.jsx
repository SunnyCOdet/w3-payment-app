import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Wallet, LogOut, AlertCircle, CheckCircle, Network } from 'lucide-react'; // Icons

function WalletConnect() {
  const {
    account,
    balance,
    isConnected,
    network,
    error,
    connectWallet,
    disconnectWallet
  } = useWallet();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatBalance = (bal) => {
    if (!bal) return '0.0000';
    return parseFloat(bal).toFixed(4); // Keep 4 decimal places
  }

  const getAvatarFallback = (addr) => {
    return addr ? addr.substring(2, 4).toUpperCase() : '??';
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardVariants}>
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg border border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
          <div className="flex items-center justify-between">
             <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> Wallet Status
             </CardTitle>
             {isConnected && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnectWallet}
                    className="text-xs text-muted-foreground hover:text-destructive button-scale"
                    aria-label="Disconnect Wallet"
                >
                    <LogOut className="w-3 h-3 mr-1" /> Disconnect
                </Button>
             )}
          </div>

        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!isConnected ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Connect your wallet to proceed.</p>
              <Button
                onClick={connectWallet}
                className="w-full connect-pulse button-scale shadow-md"
                aria-label="Connect Wallet"
              >
                <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
              </Button>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-sm text-destructive flex items-center justify-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" /> {error}
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 border-2 border-green-500 shadow-sm">
                  {/* Placeholder image or dynamic one based on address/ENS */}
                  <AvatarImage src={`https://api.dicebear.com/8.x/identicon/svg?seed=${account}`} alt="Wallet Avatar" />
                  <AvatarFallback>{getAvatarFallback(account)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground truncate" title={account}>
                    {formatAddress(account)}
                  </p>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1"><Network className="w-4 h-4"/> Network:</span>
                    <span className="font-medium">{network ? `${network.name} (${network.chainId})` : 'Loading...'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-semibold text-lg text-primary">{formatBalance(balance)} ETH</span>
                 </div>
              </div>
               {error && ( // Show non-connection errors here too
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" /> {error}
                </motion.div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default WalletConnect;
