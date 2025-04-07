import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'; // Icons

function PaymentForm({ signer, account, provider, updateBalance }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const { toast } = useToast();

  const getEtherscanLink = (hash) => {
    if (!provider || !hash) return null;
    // Basic check for Sepolia testnet
    const chainId = provider.network?.chainId;
    const baseUrl = chainId === 11155111
      ? 'https://sepolia.etherscan.io'
      : 'https://etherscan.io'; // Default to mainnet
    return `${baseUrl}/tx/${hash}`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!signer || !recipient || !amount) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please connect wallet, enter recipient and amount.",
      });
      return;
    }

    if (!ethers.isAddress(recipient)) {
      toast({
        variant: "destructive",
        title: "Invalid Address",
        description: "The recipient address is not valid.",
      });
      return;
    }

     if (recipient.toLowerCase() === account.toLowerCase()) {
        toast({
            variant: "destructive",
            title: "Self-Transaction",
            description: "Cannot send funds to your own address.",
        });
        return;
     }


    let parsedAmount;
    try {
        parsedAmount = ethers.parseEther(amount);
        if (parsedAmount <= 0n) throw new Error("Amount must be positive");
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Invalid Amount",
            description: "Please enter a valid positive amount of ETH.",
        });
        return;
    }


    setIsLoading(true);
    setTxHash('');
    const toastId = `send-tx-${Date.now()}`; // Unique ID for potential updates

    try {
      const tx = {
        to: recipient,
        value: parsedAmount
      };

      toast({
        id: toastId,
        title: "Processing Transaction",
        description: (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending {amount} ETH to {recipient.substring(0, 6)}...
          </div>
        ),
        duration: Infinity, // Keep open until updated
      });

      const transactionResponse = await signer.sendTransaction(tx);
      setTxHash(transactionResponse.hash);
      const etherscanLink = getEtherscanLink(transactionResponse.hash);

      toast({
        id: toastId, // Update the existing toast
        title: "Transaction Initiated",
        description: (
          <div className="flex flex-col gap-1">
            <span>Waiting for confirmation...</span>
            {etherscanLink && (
              <a href={etherscanLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                 View on Etherscan <ExternalLink className="w-3 h-3"/>
              </a>
            )}
          </div>
        ),
         duration: Infinity,
      });

      // Wait for confirmation (1 block)
      const receipt = await transactionResponse.wait(1);

      if (receipt.status === 1) {
        toast({
           id: toastId,
           variant: "default", // Use default for success (often green-ish)
           title: "Payment Successful!",
           description: (
             <div className="flex flex-col gap-1">
                <span>Successfully sent {amount} ETH.</span>
                 {etherscanLink && (
                    <a href={etherscanLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        View on Etherscan <ExternalLink className="w-3 h-3"/>
                    </a>
                 )}
             </div>
           ),
           duration: 5000, // Auto-close after 5s
        });
        setRecipient('');
        setAmount('');
        // Trigger balance update in parent
        if (updateBalance && account && provider) {
            updateBalance(account, provider);
        }
      } else {
        throw new Error("Transaction failed on-chain."); // Trigger catch block
      }

    } catch (error) {
      console.error("Payment failed:", error);
      let title = "Payment Failed";
      let description = error.message;

      if (error.code === 'ACTION_REJECTED') {
        title = "Transaction Rejected";
        description = "You cancelled the transaction in your wallet.";
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        title = "Insufficient Funds";
        description = "Not enough ETH in your wallet for this transaction + gas.";
      } else if (error.message.includes("failed on-chain")) {
         title = "Transaction Failed";
         description = "The transaction was reverted on the blockchain.";
      }

       toast({
         id: toastId, // Update the existing toast
         variant: "destructive",
         title: title,
         description: (
            <div className="flex flex-col gap-1">
                <span>{description}</span>
                 {txHash && getEtherscanLink(txHash) && ( // Show link even for failed tx if hash exists
                    <a href={getEtherscanLink(txHash)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        View on Etherscan <ExternalLink className="w-3 h-3"/>
                    </a>
                 )}
             </div>
         ),
         duration: 8000, // Keep error visible longer
       });

    } finally {
      setIsLoading(false);
    }
  };

   const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2, ease: "easeOut" } }
  };


  return (
     <motion.div initial="hidden" animate="visible" variants={formVariants}>
        <Card className="w-full max-w-md mx-auto mt-6 shadow-lg border border-primary/20">
        <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Send Payment
            </CardTitle>
            <CardDescription>Enter recipient address and amount in ETH.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                required
                disabled={isLoading}
                className="transition-shadow focus:shadow-outline"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount">Amount (ETH)</Label>
                <Input
                id="amount"
                type="number"
                step="any"
                min="0" // Basic validation
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                required
                disabled={isLoading}
                className="transition-shadow focus:shadow-outline"
                />
            </div>
            <Button type="submit" disabled={isLoading || !signer} className="w-full button-scale shadow-md">
                {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Send className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Processing...' : 'Send ETH'}
            </Button>
            </form>
        </CardContent>
        </Card>
     </motion.div>
  );
}

export default PaymentForm;
