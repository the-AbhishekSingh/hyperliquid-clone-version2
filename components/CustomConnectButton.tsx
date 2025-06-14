"use client";
import { useState } from "react";
import { ConnectModal } from "./ConnectModal";
import { useWeb3 } from "../app/providers/web3-provider";

export function CustomConnectButton() {
  const { connect } = useWeb3();
  const [modalOpen, setModalOpen] = useState(false);

  const handleConnectWallet = async () => {
    await connect();
    setModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="border border-cyan-400 text-cyan-400 bg-[#181e2a] hover:bg-[#232b3b] font-medium py-2 px-6 rounded transition-colors"
      >
        Connect
      </button>
      <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnectWallet={handleConnectWallet}
        onConnectWalletConnect={() => alert('WalletConnect not implemented yet')}
        onConnectOKX={() => alert('OKX Wallet not implemented yet')}
        onConnectCoinbase={() => alert('Coinbase Wallet not implemented yet')}
        onConnectEmail={() => alert('Email login not implemented yet')}
      />
    </>
  );
} 