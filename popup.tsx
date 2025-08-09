import { useState, useEffect } from "react"
import "./style.css"

type UserType = "viewer" | "streamer" | null

function IndexPopup() {
  const [userType, setUserType] = useState<UserType>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [balance] = useState("25.50")
  const [currentTab, setCurrentTab] = useState<{ url: string, title: string }>({ url: "", title: "" })
  const [detectedStreamer, setDetectedStreamer] = useState<{ name: string, platform: string } | null>(null)

  // Simulate getting current tab info
  useEffect(() => {
    // In real implementation, you'd get this from chrome.tabs API
    const mockTab = {
      url: "https://www.youtube.com/watch?v=example",
      title: "Amazing Gaming Stream - TechStreamer99"
    }
    setCurrentTab(mockTab)

    // Simulate streamer detection
    if (mockTab.url.includes("youtube.com") || mockTab.url.includes("twitch.tv")) {
      setDetectedStreamer({
        name: "TechStreamer99",
        platform: mockTab.url.includes("youtube.com") ? "YouTube" : "Twitch"
      })
    }
  }, [])

  if (userType === null) {
    return <UserTypeSelection onSelect={setUserType} />
  }

  if (userType === "streamer") {
    return <StreamerDashboard />
  }

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
          <WalletConnection onConnect={() => setIsWalletConnected(true)} />
        ) : (
          <DonationPage
            detectedStreamer={detectedStreamer}
            currentTab={currentTab}
          />
        )}
      </main>

      {/* Footer */}
      {isWalletConnected && (
        <footer className="app-footer">
          <button
            className="footer-btn"
            onClick={() => setUserType(null)}
          >
            Switch Mode
          </button>
        </footer>
      )}
    </div>
  )
}

// User Type Selection Component
function UserTypeSelection({ onSelect }: { onSelect: (type: UserType) => void }) {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎁</span>
            <span className="logo-text">DonateStream</span>
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="page user-selection">
          <div className="welcome-section">
            <h1>Welcome to DonateStream</h1>
            <p>Support your favorite streamers with USDC donations</p>
          </div>

          <div className="user-type-cards">
            <button
              className="user-type-card viewer-card"
              onClick={() => onSelect("viewer")}
            >
              <span className="card-icon">👀</span>
              <h3>I'm a Viewer</h3>
              <p>I want to donate to streamers</p>
            </button>

            <button
              className="user-type-card streamer-card"
              onClick={() => onSelect("streamer")}
            >
              <span className="card-icon">🎮</span>
              <h3>I'm a Streamer</h3>
              <p>I want to receive donations</p>
            </button>
          </div>
        </div>
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
      {detectedStreamer ? (
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
      ) : (
        <div className="no-streamer">
          <span className="no-streamer-icon">📺</span>
          <p>No streamer detected on this page</p>
          <span className="current-url">{currentTab.url}</span>
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

// Streamer Dashboard Component (Placeholder)
function StreamerDashboard() {
  const [recentDonations] = useState([
    { donor: "viewer123", amount: "5.00", message: "Amazing stream!", time: "2 mins ago" },
    { donor: "gamer456", amount: "1.00", message: "Keep it up!", time: "5 mins ago" },
    { donor: "fan789", amount: "0.50", message: "Love the content", time: "8 mins ago" }
  ])

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎮</span>
            <span className="logo-text">Streamer Dashboard</span>
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="page streamer-dashboard">
          <div className="dashboard-stats">
            <div className="stat-card">
              <span className="stat-icon">💰</span>
              <div className="stat-info">
                <span className="stat-value">$12.50</span>
                <span className="stat-label">Today's Total</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <div className="stat-info">
                <span className="stat-value">8</span>
                <span className="stat-label">Donors</span>
              </div>
            </div>
          </div>

          <div className="recent-donations">
            <h3>Recent Donations</h3>
            <div className="donations-list">
              {recentDonations.map((donation, index) => (
                <div key={index} className="donation-item">
                  <div className="donation-info">
                    <span className="donor-name">{donation.donor}</span>
                    <span className="donation-time">{donation.time}</span>
                    {donation.message && (
                      <span className="donation-message">"{donation.message}"</span>
                    )}
                  </div>
                  <span className="donation-amount">+${donation.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default IndexPopup
