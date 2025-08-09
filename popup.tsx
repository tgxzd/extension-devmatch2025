import { useState, useEffect } from "react"
import "./style.css"

function IndexPopup() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [balance] = useState("25.50")
  const [currentTab, setCurrentTab] = useState<{ url: string, title: string }>({ url: "", title: "" })
  const [detectedStreamer, setDetectedStreamer] = useState<{ name: string, platform: string } | null>(null)

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
    setIsWalletConnected(true)
    
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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎁</span>
            <span className="logo-text">DonateStream</span>
          </div>
          {isWalletConnected && (
            <div className="balance-display">
              <span className="balance-label">Balance</span>
              <span className="balance-amount">${balance} USDC</span>
            </div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="page-content">
        {!isWalletConnected ? (
          <WalletConnection onConnect={handleWalletConnect} />
        ) : (
          <DonationPage
            detectedStreamer={detectedStreamer}
            currentTab={currentTab}
          />
        )}
      </main>


    </div>
  )
}



// Wallet Connection Component
function WalletConnection({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="page wallet-connection">
      <div className="connection-section">
        <div className="wallet-icon">🔗</div>
        <h2>Connect Your Wallet</h2>
        <p>Connect your wallet to start donating to streamers with USDC</p>

        <div className="network-info">
          <span className="network-badge">Coinbase Circle Testnet</span>
          <p className="network-desc">Using USDC on Circle testnet for secure donations</p>
        </div>

        <button className="connect-btn" onClick={onConnect}>
          <span className="btn-icon">👛</span>
          Connect Wallet
        </button>

        <div className="security-note">
          <span className="security-icon">🔒</span>
          <p>Your wallet connection is secure and encrypted</p>
        </div>
      </div>
    </div>
  )
}

// Donation Page Component
function DonationPage({
  detectedStreamer,
  currentTab
}: {
  detectedStreamer: { name: string, platform: string } | null,
  currentTab: { url: string, title: string }
}) {
  const [selectedAmount, setSelectedAmount] = useState<string>("")
  const [message, setMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const donationOptions = [
    { emoji: "☕", amount: "0.1", label: "Coffee" },
    { emoji: "🍕", amount: "0.5", label: "Slice" },
    { emoji: "🍔", amount: "1", label: "Burger" },
    { emoji: "🎉", amount: "5", label: "Party" }
  ]

  const handleDonate = () => {
    if (!selectedAmount || !detectedStreamer) return

    // Simulate donation
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)

    // Reset form
    setSelectedAmount("")
    setMessage("")
  }

  if (showSuccess) {
    return (
      <div className="page success-page">
        <div className="success-animation">
          <div className="success-icon">🎉</div>
          <h2>Donation Sent!</h2>
          <p>Your ${selectedAmount} USDC donation was sent to {detectedStreamer?.name}</p>
          <div className="success-message">
            {message && (
              <div className="message-preview">
                <span className="message-label">Your message:</span>
                <span className="message-text">"{message}"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page donation-page">
      {/* Current Tab Info */}
      <div className="tab-info">
        <div className="tab-url">
          <span className="url-label">Current page:</span>
          <span className="url-text">{currentTab.url}</span>
        </div>
        {currentTab.title && (
          <div className="tab-title">
            <span className="title-text">{currentTab.title}</span>
          </div>
        )}
      </div>

      {detectedStreamer && (
        <div className="streamer-section">
          <div className="streamer-card">
            <div className="streamer-avatar">
              <span>{detectedStreamer.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="streamer-info">
              <h3>{detectedStreamer.name}</h3>
              <span className="platform-badge">{detectedStreamer.platform}</span>
            </div>
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
        </div>
      )}

      <div className="donation-section">
        <h3>Choose donation amount</h3>

        <div className="donation-grid">
          {donationOptions.map((option) => (
            <button
              key={option.amount}
              className={`donation-option ${selectedAmount === option.amount ? "selected" : ""}`}
              onClick={() => setSelectedAmount(option.amount)}
            >
              <span className="option-emoji">{option.emoji}</span>
              <span className="option-amount">${option.amount}</span>
              <span className="option-label">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="message-section">
          <label>Add a message (optional)</label>
          <textarea
            placeholder="Say something nice to the streamer..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-textarea"
            maxLength={150}
          />
          <span className="char-count">{message.length}/150</span>
        </div>

        <button
          className="donate-btn"
          onClick={handleDonate}
          disabled={!selectedAmount || !detectedStreamer}
        >
          <span className="btn-icon">💝</span>
          Donate ${selectedAmount} USDC
        </button>
      </div>
    </div>
  )
}



export default IndexPopup
