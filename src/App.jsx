import React from 'react';
// Import motion AND AnimatePresence from framer-motion
import { motion, AnimatePresence } from 'framer-motion';
import WalletConnect from './components/WalletConnect';
import PaymentForm from './components/PaymentForm';
import { useWallet } from './hooks/useWallet';
import { Github, Zap } from 'lucide-react'; // Icons

function App() {
  const { signer, account, isConnected, provider, updateBalance } = useWallet(); // Get updateBalance

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger animation of children
        delayChildren: 0.1,
      }
    }
  };

   const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };


  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-4 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
       <motion.div variants={itemVariants} className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center gap-2">
                <Zap className="w-8 h-8 text-yellow-400 animate-pulse"/> Web3 PayHub
            </h1>
            <p className="text-muted-foreground">Send ETH instantly using your wallet.</p>
       </motion.div>


      {/* WalletConnect component handles its own animation internally */}
      <WalletConnect />

      {/* Use the imported AnimatePresence */}
      <AnimatePresence>
        {isConnected && account && (
          // PaymentForm handles its own animation internally
          <PaymentForm
            signer={signer}
            account={account}
            provider={provider}
            updateBalance={updateBalance} // Pass updateBalance down
          />
        )}
      </AnimatePresence>

      {!isConnected && (
         <motion.p variants={itemVariants} className="text-center text-muted-foreground mt-4">
            Connect your wallet to start sending payments.
         </motion.p>
      )}

       <motion.footer variants={itemVariants} className="text-center text-xs text-muted-foreground mt-12">
            <p>Built with React, Shadcn UI, Ethers.js & Framer Motion.</p>
            <a
                href="https://github.com/w4u-labs" // Updated link
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
                <Github className="w-3 h-3" /> View on GitHub
            </a>
       </motion.footer>

    </motion.div>
  );
}

export default App;
