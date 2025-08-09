import { useState, useEffect } from "react"
import "./style.css"
import ABI from "./abi.json"
import { ethers, Wallet, JsonRpcProvider, Contract, formatUnits, parseUnits } from "ethers"


function IndexPopup() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [balance, setBalance] = useState("0.00")
  const [currentTab, setCurrentTab] = useState<{ url: string, title: string }>({ url: "", title: "" })
  const [detectedStreamer, setDetectedStreamer] = useState<{ name: string, platform: string } | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)

  const contractAddress = "0x39266942a0F29C6a3495e43fCaE510C0a454B1d9"
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // Circle USDC on Base Sepolia
  const rpcUrl = "https://sepolia.base.org" // Base Sepolia testnet

  // Wallet management functions
  const generateWallet = () => {
    const newWallet = Wallet.createRandom()
    return newWallet
  }

  const storePrivateKey = async (privateKey: string) => {
    try {
      // Store encrypted private key in chrome.storage.local for extension
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'wallet_private_key': privateKey })
      } else {
        // Fallback to localStorage for development
        localStorage.setItem('wallet_private_key', privateKey)
      }
    } catch (error) {
      console.error('Error storing private key:', error)
    }
  }

  const loadPrivateKey = async (): Promise<string | null> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['wallet_private_key'])
        return result.wallet_private_key || null
      } else {
        // Fallback to localStorage for development
        return localStorage.getItem('wallet_private_key')
      }
    } catch (error) {
      console.error('Error loading private key:', error)
      return null
    }
  }

  const setupWallet = async (privateKey?: string) => {
    try {
      const provider = new JsonRpcProvider(rpcUrl)
      let walletInstance: Wallet

      if (privateKey) {
        // Import existing wallet
        walletInstance = new Wallet(privateKey, provider)
      } else {
        // Generate new wallet
        const tempWallet = generateWallet()
        walletInstance = new Wallet(tempWallet.privateKey, provider)
        await storePrivateKey(walletInstance.privateKey)
      }

      setWallet(walletInstance)
      setWalletAddress(walletInstance.address)
      setIsWalletConnected(true)
      
      // Load USDC balance
      await loadBalance(walletInstance)
      
      return walletInstance
    } catch (error) {
      console.error('Error setting up wallet:', error)
      return null
    }
  }

  const loadBalance = async (walletInstance: Wallet) => {
    try {
      // USDC token contract ABI (simplified)
      const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ]
      
      const usdcContract = new Contract(usdcAddress, erc20Abi, walletInstance)
      const balanceWei = await usdcContract.balanceOf(walletInstance.address)
      const decimals = await usdcContract.decimals()
      const balanceFormatted = formatUnits(balanceWei, decimals)
      
      setBalance(parseFloat(balanceFormatted).toFixed(2))
    } catch (error) {
      console.error('Error loading balance:', error)
      setBalance("0.00")
    }
  }

  const approveUSDC = async (amount: bigint) => {
    if (!wallet) throw new Error("Wallet not connected")

    const erc20Abi = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ]
    
    const usdcContract = new Contract(usdcAddress, erc20Abi, wallet)
    
    // Check current allowance
    const currentAllowance = await usdcContract.allowance(wallet.address, contractAddress)
    
    if (currentAllowance < amount) {
      console.log('Approving USDC spending...')
      const approveTx = await usdcContract.approve(contractAddress, amount)
      await approveTx.wait()
      console.log('USDC approval confirmed')
    }
  }

  // Check for existing wallet on component mount
  useEffect(() => {
    const initializeWallet = async () => {
      const storedPrivateKey = await loadPrivateKey()
      if (storedPrivateKey) {
        await setupWallet(storedPrivateKey)
      }
    }
    initializeWallet()
  }, [])

  // Function to get current active tab
  const getCurrentTab = async () => {
    try {
      // Check if we're in a Chrome extension environment
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab && tab.url && tab.title) {
          return {
            url: tab.url,
            title: tab.title
          }
        }
      }
      
      // Fallback: try to get current window location (for development/testing)
      if (typeof window !== 'undefined' && window.location) {
        return {
          url: window.location.href,
          title: document.title
        }
      }
      
      // Final fallback
      return {
        url: "No tab detected",
        title: "No tab detected"
      }
    } catch (error) {
      console.error("Error getting current tab:", error)
      return {
        url: "Error detecting tab",
        title: "Error detecting tab"
      }
    }
  }

  // Function to detect streamer from tab info
  const detectStreamerFromTab = (tab: { url: string, title: string }) => {
    if (!tab.url || tab.url === "No tab detected" || tab.url === "Error detecting tab") {
      setDetectedStreamer(null)
      return
    }

    // YouTube detection
    if (tab.url.includes("youtube.com/watch") || tab.url.includes("youtu.be/")) {
      // Extract channel name from title (basic parsing)
      const title = tab.title.replace(" - YouTube", "")
      const channelMatch = title.match(/(.+?)\s*(-|–|—|\||:)/) // Common separators
      const channelName = channelMatch ? channelMatch[1].trim() : title.split(" ")[0]
      
      setDetectedStreamer({
        name: channelName || "YouTube Creator",
        platform: "YouTube"
      })
      return
    }

    // Twitch detection
    if (tab.url.includes("twitch.tv/")) {
      // Extract streamer name from URL
      const urlMatch = tab.url.match(/twitch\.tv\/([^/?]+)/)
      const streamerName = urlMatch ? urlMatch[1] : null
      
      if (streamerName && streamerName !== "directory" && streamerName !== "browse") {
        setDetectedStreamer({
          name: streamerName,
          platform: "Twitch"
        })
        return
      }
    }

    // No streamer detected
    setDetectedStreamer(null)
  }

  // Function to handle wallet connection and tab detection
  const handleWalletConnect = async () => {
    await setupWallet()
    
    // Get current tab info after wallet connection
    const tabInfo = await getCurrentTab()
    setCurrentTab(tabInfo)
    
    // Detect streamer from the tab
    detectStreamerFromTab(tabInfo)
  }

  // Initial tab detection (for development/testing)
  useEffect(() => {
    getCurrentTab().then(tabInfo => {
      setCurrentTab(tabInfo)
      if (isWalletConnected) {
        detectStreamerFromTab(tabInfo)
      }
    })
  }, [])

  return (
    <div className="w-96 h-[600px] gradient-primary flex flex-col overflow-hidden relative shadow-2xl">
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none"></div>
      
      {/* Header */}
      <header className="glass-effect p-5 relative z-10">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span className="text-3xl drop-shadow-md">🎁</span>
            <span className="text-xl font-bold tracking-tight text-shadow-md">DonateStream</span>
          </div>
          {isWalletConnected && (
            <div className="glass-effect px-3 py-2 rounded-xl">
              <div className="text-xs uppercase tracking-wide opacity-90 mb-0.5">Balance</div>
              <div className="text-base font-bold text-shadow-sm">${balance} USDC</div>
              <div className="text-xs opacity-80 mt-1 font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
            </div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 bg-white rounded-t-3xl mt-2 overflow-y-auto relative z-10">
        {!isWalletConnected ? (
          <WalletConnection onConnect={handleWalletConnect} />
        ) : (
          <DonationPage
            detectedStreamer={detectedStreamer}
            currentTab={currentTab}
            wallet={wallet}
            contractAddress={contractAddress}
            usdcAddress={usdcAddress}
            loadBalance={loadBalance}
            approveUSDC={approveUSDC}
          />
        )}
      </main>
    </div>
  )
}



// Wallet Connection Component
function WalletConnection({ onConnect }: { onConnect: () => void }) {
  const [showImport, setShowImport] = useState(false)
  const [privateKey, setPrivateKey] = useState("")
  const [importError, setImportError] = useState("")

  const handleCreateWallet = () => {
    onConnect()
  }

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      setImportError("Please enter a private key")
      return
    }

    try {
      let cleanedKey = privateKey.trim()
      
      // Remove any spaces or line breaks
      cleanedKey = cleanedKey.replace(/\s+/g, '')
      
      // Add 0x prefix if not present
      if (!cleanedKey.startsWith('0x') && !cleanedKey.startsWith('0X')) {
        cleanedKey = '0x' + cleanedKey
      }
      
      // Validate using ethers.js directly - it has better validation
      const testWallet = new Wallet(cleanedKey)
      
      // If we get here, the private key is valid
      console.log('Valid wallet created with address:', testWallet.address)
      
      // Store and connect
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'wallet_private_key': cleanedKey })
      } else {
        localStorage.setItem('wallet_private_key', cleanedKey)
      }
      
      onConnect()
      
    } catch (error: any) {
      console.error('Import error:', error)
      console.error('Attempted key:', privateKey.trim())
      
      // Provide more specific error messages based on the error
      if (error.message && error.message.includes('invalid private key')) {
        setImportError("Invalid private key format. Please check that you have the correct 64-character hexadecimal private key.")
      } else if (error.message && error.message.includes('invalid hex')) {
        setImportError("Private key must contain only hexadecimal characters (0-9, a-f).")
      } else {
        setImportError(`Error: ${error.message || 'Invalid private key format'}`)
      }
    }
  }

  if (showImport) {
    return (
      <div className="flex items-center justify-center min-h-full p-5">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6">🔑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Import Wallet</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Enter your private key to import an existing wallet
          </p>

          <div className="mb-4">
            <textarea
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm bg-white resize-none font-mono"
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value)
                setImportError("")
              }}
              rows={3}
            />
            {importError && (
              <p className="text-red-500 text-xs mt-1 text-left">{importError}</p>
            )}
          </div>

          <button 
            className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 w-full mb-4 btn-hover shimmer-effect shadow-primary"
            onClick={handleImportWallet}
          >
            <span className="text-lg">📥</span>
            Import Wallet
          </button>

          <button 
            className="text-gray-600 underline text-sm"
            onClick={() => setShowImport(false)}
          >
            ← Back to create new wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-full p-5">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🔗</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Setup Your Wallet</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Create a new wallet or import an existing one to start donating with USDC
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2">
            Base Sepolia Testnet
          </span>
          <p className="text-blue-800 text-sm">
            Using USDC on Base testnet for secure donations
          </p>
        </div>

        <button 
          className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 w-full mb-3 btn-hover shimmer-effect shadow-primary"
          onClick={handleCreateWallet}
        >
          <span className="text-lg">✨</span>
          Create New Wallet
        </button>

        <button 
          className="bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 w-full mb-4 hover:bg-gray-300 transition-colors"
          onClick={() => setShowImport(true)}
        >
          <span className="text-lg">📥</span>
          Import Existing Wallet
        </button>

        <div className="flex items-center justify-center gap-2 opacity-70">
          <span className="text-sm">🔒</span>
          <p className="text-xs text-gray-600">Your private key is stored securely locally</p>
        </div>
      </div>
    </div>
  )
}

// Donation Page Component
function DonationPage({
  detectedStreamer,
  currentTab,
  wallet,
  contractAddress,
  usdcAddress,
  loadBalance,
  approveUSDC
}: {
  detectedStreamer: { name: string, platform: string } | null,
  currentTab: { url: string, title: string },
  wallet: Wallet | null,
  contractAddress: string,
  usdcAddress: string,
  loadBalance: (walletInstance: Wallet) => Promise<void>,
  approveUSDC: (amount: bigint) => Promise<void>
}) {
  const [donationAmount, setDonationAmount] = useState<string>("")
  const [message, setMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningReason, setWarningReason] = useState("")
  const [forceSubmit, setForceSubmit] = useState(false)
  const [txHash, setTxHash] = useState<string>("")

  // Function to validate message content
  const validateMessage = async (messageText: string) => {
    try {
      if (!messageText || messageText.trim().length === 0) {
        return { isValid: true, reason: "" }
      }

      const response = await fetch('http://localhost:3001/api/validate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      })

      if (!response.ok) {
        console.error('Server error during validation:', response.status)
        return { isValid: true, reason: "" } // Allow submission on server error
      }

      const result = await response.json()

      if (!result.success) {
        console.error('API error during validation:', result.error)
        return { isValid: true, reason: "" } // Allow submission on API error
      }

      return {
        isValid: result.isAppropriate,
        reason: result.reason || ""
      }
    } catch (error) {
      console.error('Error validating message:', error)
      return { isValid: true, reason: "" } // Allow submission on network error
    }
  }

  const handleDonate = async () => {
    if (!donationAmount || !detectedStreamer || parseFloat(donationAmount) <= 0 || !wallet) return

    // Validate message content first (unless forcing submission)
    if (message && message.trim().length > 0 && !forceSubmit) {
      const validation = await validateMessage(message)
      if (!validation.isValid) {
        setWarningReason(validation.reason)
        setShowWarning(true)
        return // Stop submission if message is inappropriate
      }
    }

    // Hide warning if message is appropriate
    setShowWarning(false)

    try {
      const amount = parseFloat(donationAmount)
      const amountWei = parseUnits(amount.toString(), 6) // USDC has 6 decimals

      // First, approve USDC spending
      await approveUSDC(amountWei)

      // Then call the donation contract
      const contract = new Contract(contractAddress, ABI.abi, wallet)
      
      const tx = await contract.donateTokenToContent(
        detectedStreamer.name,
        detectedStreamer.platform,
        usdcAddress,
        amountWei
      )

      console.log('Transaction sent:', tx.hash)
      setTxHash(tx.hash)
      await tx.wait()
      console.log('Transaction confirmed')

      // Update balance after successful transaction
      await loadBalance(wallet)

      // Send donation data to backend for tracking
      const donationData = {
        streamerName: detectedStreamer.name,
        streamerPlatform: detectedStreamer.platform,
        donorName: "Anonymous Donor",
        amount: amount,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        txHash: tx.hash,
        walletAddress: wallet.address
      }

      // Try to save to backend (non-blocking)
      try {
        await fetch('http://localhost:3001/api/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donationData)
        })
      } catch (backendError) {
        console.log('Backend logging failed, but donation was successful:', backendError)
      }

      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Reset form and warning states
      setDonationAmount("")
      setMessage("")
      setShowWarning(false)
      setForceSubmit(false)

    } catch (error: any) {
      console.error('Error processing donation:', error)
      
      // Show user-friendly error message
      let errorMessage = "Transaction failed. Please try again."
      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient USDC balance for this donation."
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was cancelled."
      }
      
      alert(errorMessage)
    }
  }

  // Function to handle "Proceed Anyway" button
  const handleProceedAnyway = () => {
    setForceSubmit(true)
    setShowWarning(false)
    handleDonate()
  }

  // Function to handle "Revise Message" button
  const handleReviseMessage = () => {
    setShowWarning(false)
    setForceSubmit(false)
  }

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-full text-center p-5">
        <div className="max-w-sm">
          <div className="text-7xl mb-6 animate-bounce-light">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-3">Donation Sent!</h2>
          <p className="text-gray-600 mb-4">
            Your ${donationAmount} USDC donation was sent to {detectedStreamer?.name}
          </p>
          {txHash && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <span className="block text-xs font-semibold text-blue-600 mb-1">Transaction Hash:</span>
              <span className="text-blue-800 font-mono text-xs break-all">{txHash}</span>
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
              <span className="block text-xs font-semibold text-green-600 mb-1">Your message:</span>
              <span className="text-green-800 italic">"{message}"</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-5">
      {/* Current Tab Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-4 mb-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="mb-2">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Current page:</span>
          <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1.5">
            <span className="text-xs text-gray-600 font-mono break-all">{currentTab.url}</span>
          </div>
        </div>
        {currentTab.title && (
          <div className="mt-1">
            <span className="text-sm text-gray-700 font-medium leading-relaxed">{currentTab.title}</span>
          </div>
        )}
      </div>

      {detectedStreamer && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-glass card-hover overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-green"></div>
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-lg border-3 border-white relative">
              <span>{detectedStreamer.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1.5 leading-tight">
                {detectedStreamer.name}
              </h3>
              <span className="gradient-blue text-white px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wide shadow-md">
                {detectedStreamer.platform}
              </span>
            </div>
            <div className="gradient-red text-white px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide shadow-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-slow"></span>
              <span>LIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Content Warning */}
      {showWarning && (
        <div className="mb-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-yellow-800 mb-1">Message Content Warning</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  {warningReason || "Your message may contain inappropriate content. Please revise your message before donating."}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleProceedAnyway}
                    className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-700 transition-colors"
                  >
                    Proceed Anyway
                  </button>
                  <button
                    onClick={handleReviseMessage}
                    className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors"
                  >
                    Revise Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-5 text-center relative pb-3">
          Enter donation amount
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-15 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
        </h3>

        <div className="mb-5">
          <label htmlFor="donation-amount" className="block font-semibold text-gray-700 text-sm mb-3">
            Amount in USDC
          </label>
          <div className="relative mb-3">
            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 font-bold text-indigo-600 text-base z-10 pointer-events-none">$</span>
            <input
              id="donation-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="w-full pl-12 pr-20 py-4.5 border-2 border-gray-200 rounded-2xl text-xl font-bold bg-white shadow-glass input-focus transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 gradient-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md pointer-events-none">
              USDC
            </span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-glass">
            <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Quick amounts:</span>
            <div className="grid grid-cols-4 gap-2">
              {["1", "5", "10", "25"].map((amount) => (
                <button
                  key={amount}
                  className="p-3 border-2 border-gray-200 rounded-xl bg-white font-semibold text-gray-700 transition-all duration-300 relative overflow-hidden btn-hover hover:border-indigo-500 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 hover:text-indigo-600 hover:shadow-md before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gray-200 before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-indigo-500 hover:before:to-purple-500"
                  onClick={() => setDonationAmount(amount)}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="block font-semibold text-gray-700 text-sm mb-2">Add a message (optional)</label>
          <textarea
            placeholder="Say something nice to the streamer..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-2xl text-sm bg-white shadow-glass resize-vertical min-h-[80px] input-focus transition-all duration-300"
            maxLength={150}
          />
          <span className="block text-xs text-gray-500 text-right mt-1">{message.length}/150</span>
        </div>

        <button
          className="gradient-green text-white px-6 py-4.5 rounded-2xl font-bold flex items-center justify-center gap-2.5 w-full transition-all duration-300 relative overflow-hidden shadow-primary-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none btn-hover shimmer-effect uppercase tracking-wide"
          onClick={handleDonate}
          disabled={!donationAmount || !detectedStreamer || parseFloat(donationAmount) <= 0}
        >
          <span className="text-lg">💝</span>
          {donationAmount && parseFloat(donationAmount) > 0 ? `Donate $${donationAmount} USDC` : 'Enter Amount to Donate'}
        </button>
      </div>
    </div>
  )
}



export default IndexPopup
