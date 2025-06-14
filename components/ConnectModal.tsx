"use client";
import { Modal } from "./Modal";
import { SiEthereum, SiOkx, SiCoinbase } from "react-icons/si";
import { FaWallet } from "react-icons/fa";
import { RiMailLine } from "react-icons/ri";

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnectWallet: () => Promise<void> | void;
  onConnectWalletConnect: () => Promise<void> | void;
  onConnectOKX: () => Promise<void> | void;
  onConnectCoinbase: () => Promise<void> | void;
  onConnectEmail: () => Promise<void> | void;
}

export function ConnectModal({
  open,
  onClose,
  onConnectWallet,
  onConnectWalletConnect,
  onConnectOKX,
  onConnectCoinbase,
  onConnectEmail,
}: ConnectModalProps) {
  const handleConnect = async (connectFn: () => Promise<void> | void) => {
    try {
      await connectFn();
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Connect">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleConnect(onConnectEmail)}
          className="flex items-center gap-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          <RiMailLine size={22} />
          Log in with Email
        </button>
        <div className="flex items-center justify-center text-slate-400 my-2">OR</div>
        <button
          onClick={() => handleConnect(onConnectWallet)}
          className="flex items-center gap-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          <SiEthereum size={22} />
          Default Wallet
        </button>
        <button
          onClick={() => handleConnect(onConnectWalletConnect)}
          className="flex items-center gap-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          <FaWallet size={22} />
          WalletConnect
        </button>
        <button
          onClick={() => handleConnect(onConnectOKX)}
          className="flex items-center gap-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          <SiOkx size={22} />
          OKX Wallet
        </button>
        <button
          onClick={() => handleConnect(onConnectCoinbase)}
          className="flex items-center gap-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          <SiCoinbase size={22} />
          Coinbase Wallet
        </button>
      </div>
    </Modal>
  );
} 