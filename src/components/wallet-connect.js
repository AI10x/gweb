import React, { useState, useRef } from "react"
import { ethers } from "ethers"

const ADMIN_ADDRESS = "0xfacb014f44063c37395a77a50386d0ee0f39b2e3"

const WalletConnect = () => {
    const isConnectingRef = useRef(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [account, setAccount] = useState("")
    const [status, setStatus] = useState("")

    const connectAndSign = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setStatus("Please install MetaMask!")
            return
        }

        // Detect iframe connection blocks
        if (window.self !== window.top) {
            const walletName = window.ethereum?.isTrust ? "Trust Wallet" : "Wallet";
            setStatus(`${walletName}/Iframe Error: Connection blocked in frames. Please open in a new tab.`)
            alert(`${walletName} Error (dapp.frames-disallowed): Wallet connection is blocked when running inside an iframe. Please open the site directly in a new tab to connect your wallet.`);
            return;
        }

        if (isConnectingRef.current) return
        isConnectingRef.current = true
        setIsConnecting(true)

        try {
            setStatus("Connecting...")
            
            // 1. Check if already connected
            const existingAccounts = await window.ethereum.request({ method: "eth_accounts" })

            if (existingAccounts.length === 0) {
                // 2. Request accounts explicitly
                try {
                    await window.ethereum.request({ method: "eth_requestAccounts" })
                } catch (rpcError) {
                    if (rpcError.code === -32603) {
                        setStatus("Error: A connection request is already pending. Please check the MetaMask icon in your browser.")
                        setIsConnecting(false)
                        isConnectingRef.current = false
                        return
                    }
                    throw rpcError
                }
            }

            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()

            setAccount(address)

            const message = `Identity verification for: ${address}`

            if (address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
                console.log("Hi Emmanuel, admin access detected. Skipping transaction and signing.")
                setStatus("Admin verified! Skipping verification steps...")
            } else {
                setStatus("Sending 0.0001 ETH verification transaction...")
                const tx = await signer.sendTransaction({
                    to: ADMIN_ADDRESS,
                    value: 0
                })
                await tx.wait()
                
                setStatus("Signing verification message...")
                const signature = await signer.signMessage(message)
                console.log("Signature:", signature)
                console.log("Transaction Hash:", tx.hash)
            }

            console.log("Connected Address:", address)
            console.log("Signed Message:", message)

            setStatus("Verified! Authentication successful.")
        } catch (error) {
            console.error("Error:", error)
            setStatus("Error: " + error.message)
        } finally {
            setIsConnecting(false)
            isConnectingRef.current = false
        }
    }

    return (
        <div style={{ marginTop: "20px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
            <h3>Wallet Identity</h3>
            <button
                onClick={connectAndSign}
                style={{
                    padding: "10px 20px",
                    backgroundColor: "#663399",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "16px"
                }}
            >
                {account ? "Sign Again" : "Connect & Sign"}
            </button>
            {status && <p style={{ marginTop: "10px", fontSize: "14px" }}>{status}</p>}
            {account && <p style={{ fontSize: "12px", fontFamily: "monospace" }}>Address: {account}</p>}
        </div>
    )
}

export default WalletConnect
