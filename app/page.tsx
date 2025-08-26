import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

/**
 * ⚠️ EDUCATIONAL USE ONLY — DEVNET-LOCKED
 * This page simulates a token-launch scam flow using **Solana devnet** so nobody can lose real funds.
 * Meant for livestreams, workshops, classrooms.
 *
 * HOW TO USE (quick)
 * 1) Next.js app → save as `pages/index.tsx`
 * 2) `npm i @solana/web3.js framer-motion`
 * 3) Wallet on **Devnet**; airdrop at https://faucet.solana.com/
 * 4) Deploy to Vercel/Netlify.
 *
 * Customization via env (optional):
 * - NEXT_PUBLIC_DEMO_ADDRESS : devnet public key to receive demo transfers
 */

// Demo-only recipient on DEVNET (public key). You can override via env for your own devnet key.
const ENV_ADDR = process.env.NEXT_PUBLIC_DEMO_ADDRESS;
const DEFAULT_ADDR = "9xXFaJ6tDa3s8o1y6g8c2o1j9nKkz9g9m5A2wVvQ3Z9T";
const DEMO_SCAMMER_ADDRESS = new PublicKey(ENV_ADDR || DEFAULT_ADDR);

// Force DEVNET connection.
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const cx = (...classes: string[]) => classes.filter(Boolean).join(" ");

export default function DevnetRugPullDemo() {
  const [walletAvailable, setWalletAvailable] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [step, setStep] = useState<
    | "intro"
    | "form"
    | "processing"
    | "error"
    | "refundFunnel"
    | "done"
  >("intro");
  const [showDetails, setShowDetails] = useState(false);
  const [showRedFlags, setShowRedFlags] = useState(false);

  const explorerTxUrl = useMemo(
    () => (txSig ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet` : null),
    [txSig]
  );

  useEffect(() => {
    const provider = (window as any)?.solana;
    setWalletAvailable(!!provider && (provider.isPhantom || provider.isCoinbase || provider.isBackpack));
    if (provider?.isPhantom && provider?.isConnected) {
      setPublicKey(provider.publicKey?.toBase58?.() ?? null);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setConnecting(true);
      const provider = (window as any)?.solana;
      if (!provider) throw new Error("No Solana wallet found. Install Phantom and switch to Devnet.");
      const res = await provider.connect();
      setPublicKey(res?.publicKey?.toBase58?.() ?? null);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const simulateScamFlow = useCallback(async () => {
    try {
      setBusy(true);
      setStep("processing");
      const provider = (window as any)?.solana;
      if (!provider?.publicKey) throw new Error("Wallet not connected.");

      // Build a SystemProgram transfer (0.001 SOL)
      const fromPubkey = provider.publicKey as PublicKey;
      const lamports = 1_000_000;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey }).add(
        SystemProgram.transfer({ fromPubkey, toPubkey: DEMO_SCAMMER_ADDRESS, lamports })
      );

      const sig = await provider.signAndSendTransaction(tx);
      const signature = sig?.signature || sig;
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      setTxSig(signature);

      // Pretend the service failed after taking payment
      await new Promise((r) => setTimeout(r, 1200));
      setStep("error");
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Transaction failed");
      setStep("form");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className={cx("min-h-screen w-full bg-slate-950 text-slate-100 p-6")}>      
      <div className={cx("mx-auto grid gap-6 max-w-6xl lg:grid-cols-[1fr,360px]")}>        
        {/* Left: Main demo */}
        <div>
          {/* Warning Banner */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={cx("mb-4 rounded-2xl p-4 border border-rose-500/40 bg-rose-900/20")}>
            <div className={cx("text-sm uppercase tracking-widest text-rose-300 font-semibold")}>EDUCATIONAL SIMULATION — DEVNET ONLY</div>
            <div className={cx("mt-1 text-xs text-rose-200/90")}>
              This mimics a token-launch scam. Transfers happen on Solana <strong>devnet</strong> using test funds. Never deploy a version that touches mainnet.
            </div>
          </motion.div>

          {/* Card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cx("rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl")}>            
            <div className={cx("flex items-center justify-between gap-4")}>              
              <h1 className={cx("text-2xl font-bold")}>Luna*Launch — “Create Your Solana Token in Seconds”</h1>
              {!publicKey ? (
                <button onClick={connectWallet} disabled={connecting} className={cx("px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition border border-white/20 text-sm")}>
                  {connecting ? "Connecting…" : walletAvailable ? "Connect Wallet" : "Install Phantom"}
                </button>
              ) : (
                <div className={cx("text-xs text-slate-300 truncate max-w-[14rem]")}>Connected: {publicKey}</div>
              )}
            </div>

            {/* Controls */}
            <div className={cx("mt-3 flex items-center gap-3")}>              
              <button onClick={() => setShowRedFlags(true)} className={cx("px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs")}>Show Red Flags</button>
              <button onClick={() => setShowDetails((x) => !x)} className={cx("px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs")}>{showDetails ? "Hide Tx Details" : "Show Tx Details"}</button>
              <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer" className={cx("text-xs underline text-slate-300 ml-auto")}>Explorer (devnet)</a>
              <a href="https://faucet.solana.com/" target="_blank" rel="noreferrer" className={cx("text-xs underline text-slate-300")}>Get Devnet SOL</a>
            </div>

            {/* Steps */}
            {step === "intro" && (
              <div className={cx("mt-6 space-y-4")}>                
                <p className={cx("text-slate-300")}>
                  You’ll see the classic pattern: <em>form → small fee → error → bogus refund path</em>. This is live on devnet so your audience can click and verify transactions safely.
                </p>
                <button onClick={() => setStep("form")} className={cx("mt-2 px-4 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 transition text-sm font-medium")}>Start</button>
              </div>
            )}

            {step === "form" && (
              <div className={cx("mt-6 grid gap-4")}>                
                <div className={cx("grid gap-2")}>                  
                  <label className={cx("text-sm text-slate-300")}>Token Name</label>
                  <input placeholder="e.g., MoonCoin" className={cx("px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none")}/>
                </div>
                <div className={cx("grid gap-2")}>                  
                  <label className={cx("text-sm text-slate-300")}>Symbol</label>
                  <input placeholder="e.g., MOON" className={cx("px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none")}/>
                </div>
                <div className={cx("grid gap-2")}>                  
                  <label className={cx("text-sm text-slate-300")}>Supply</label>
                  <input placeholder="1,000,000" className={cx("px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none")}/>
                </div>
                <div className={cx("mt-2 p-3 rounded-xl bg-amber-900/20 border border-amber-500/30 text-amber-200 text-sm")}>Service Fee: 0.001 SOL (devnet) — used for “instant deployment”</div>
                <div className={cx("flex items-center gap-3 mt-2")}>                  
                  <button onClick={simulateScamFlow} disabled={!publicKey || busy} className={cx("px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed")}>{busy ? "Processing…" : !publicKey ? "Connect Wallet to Continue" : "Create Token"}</button>
                  {txSig && (
                    <a className={cx("text-xs underline text-slate-300")} href={explorerTxUrl!} target="_blank" rel="noreferrer">View Payment on Explorer</a>
                  )}
                </div>
                {showDetails && (
                  <div className={cx("mt-3 text-xs text-slate-300 border border-white/10 rounded-xl p-3 bg-black/20")}>This demo builds a <code>SystemProgram.transfer</code> for 0.001 SOL to a devnet address (<code>{DEMO_SCAMMER_ADDRESS.toBase58()}</code>). After confirmation, it deliberately shows an error and pushes a bogus refund flow.</div>
                )}
              </div>
            )}

            {step === "processing" && (
              <div className={cx("mt-6")}>                
                <p className={cx("text-slate-300")}>Deploying your token to Solana… this usually takes under 30 seconds.</p>
                <div className={cx("mt-4 animate-pulse h-2 rounded-full bg-white/10 w-2/3")} />
              </div>
            )}

            {step === "error" && (
              <div className={cx("mt-6 space-y-3")}>                
                <div className={cx("p-3 rounded-xl bg-rose-900/30 border border-rose-500/30 text-rose-200")}>⚠️ Error: Token creation failed. Your transaction will be queued and retried automatically.</div>
                {txSig && (<div className={cx("text-xs text-slate-400")}>Payment tx: <a className={cx("underline")} href={explorerTxUrl!} target="_blank" rel="noreferrer">{txSig}</a></div>)}
                <button onClick={() => setStep("refundFunnel")} className={cx("px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm")}>Get a Refund</button>
              </div>
            )}

            {step === "refundFunnel" && (
              <div className={cx("mt-6 space-y-4")}>                
                <div className={cx("p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-200")}>Refund Bot — Step 1 of 3</div>
                <ol className={cx("list-decimal list-inside text-slate-300 space-y-1 text-sm")}>                  
                  <li>Join our <span className={cx("underline")}>Discord</span> and open a ticket.</li>
                  <li>Verify your wallet by sending <strong>another</strong> 0.001 SOL (devnet) with memo <code>REFUND</code>.</li>
                  <li>Wait 24–72 hours for manual review.</li>
                </ol>
                <div className={cx("text-xs text-slate-400")}>This is intentionally **nonsense** showing how scammers stall and extract more transfers.</div>
                <button onClick={() => setStep("done")} className={cx("px-4 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 transition text-sm font-medium")}>Finish Demo</button>
              </div>
            )}

            {step === "done" && (
              <div className={cx("mt-6 space-y-3")}>                
                <div className={cx("p-3 rounded-xl bg-emerald-900/20 border border-emerald-500/30 text-emerald-200")}>Demo complete ✅ — You saw the flow: pay → error → bogus refund path.</div>
                {txSig && (<div className={cx("text-xs text-slate-400")}>Payment tx: <a className={cx("underline")} href={explorerTxUrl!} target="_blank" rel="noreferrer">{txSig}</a></div>)}
              </div>
            )}
          </motion.div>

          <div className={cx("mt-6 text-xs text-slate-400 text-center")}>Built for education. Hard-locked to <strong>devnet</strong>. Never send real funds to untrusted sites.</div>
        </div>

        {/* Right: Explainer panel for presenters */}
        <aside className={cx("rounded-2xl border border-white/10 bg-slate-900 p-5 h-max sticky top-6")}>          
          <h2 className={cx("text-lg font-semibold")}>
            Presenter Notes
          </h2>
          <ul className={cx("mt-3 text-sm space-y-2 text-slate-300 list-disc pl-5")}>            
            <li>Stress that this site is a <em>simulation</em> with devnet-only funds.</li>
            <li>Point out the mismatch: payment succeeds on-chain, but the service claims “creation failed.”</li>
            <li>Show the Explorer link: on-chain truth vs. UI lies.</li>
            <li>Discuss stalling tactics: refund bots, extra verification payments, vague timelines.</li>
            <li>Remind viewers: real token creation doesn’t require shady middlemen.</li>
          </ul>

          <div className={cx("mt-4 text-xs text-slate-400")}>Tip: set <code>NEXT_PUBLIC_DEMO_ADDRESS</code> to your own <strong>devnet</strong> public key so viewers can see transfers to an address you control.</div>
        </aside>
      </div>

      {/* Red Flags Overlay */}
      <AnimatePresence>
        {showRedFlags && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cx("fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50")}>
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className={cx("max-w-2xl w-full rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl")}>              
              <div className={cx("flex items-start justify-between gap-4")}>                
                <h3 className={cx("text-xl font-semibold")}>Common Red Flags</h3>
                <button onClick={() => setShowRedFlags(false)} className={cx("px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs")}>Close</button>
              </div>
              <ul className={cx("mt-4 text-sm space-y-2 text-slate-300 list-disc pl-5")}>                
                <li>Pay-first “service fees” with no on-chain deliverable.</li>
                <li>Polished UI but zero transparency, docs, or verifiable code.</li>
                <li>“Creation failed, we’ll retry” after a successful payment.</li>
                <li>Refund gates: send more, join Discord, wait days.</li>
                <li>Incentivized reviews or astroturfed testimonials.</li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
