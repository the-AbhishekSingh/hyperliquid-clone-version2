"use client";
import { useWeb3 } from "../app/providers/web3-provider";
import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { SiEthereum } from "react-icons/si";

export function Header() {
  const { account, connect, disconnect, isConnecting, error } = useWeb3();
  const [modalOpen, setModalOpen] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Auto-trigger connect when modal opens
  useEffect(() => {
    if (modalOpen) {
      setConnectError(null);
      (async () => {
        try {
          await connect();
          setModalOpen(false);
        } catch (err: any) {
          setConnectError(err?.message || "Failed to connect wallet");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  const handleConnect = () => {
    setModalOpen(true);
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
      <div className="text-2xl font-bold text-white">Hyperliquid Clone</div>
      <div>
        {!account ? (
          <>
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <SiEthereum size={20} className="text-blue-400" />
              Connect Wallet
            </button>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Connect Wallet">
              <div className="flex flex-col items-center">
                {isConnecting && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-400">Connecting...</span>
                  </div>
                )}
                {connectError && <div className="text-red-500 mb-2">{connectError}</div>}
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <div className="text-slate-400 text-sm">
                  Please approve the connection in your MetaMask extension.
                </div>
              </div>
            </Modal>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-white px-3 py-1 rounded font-mono">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              onClick={disconnect}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
} 