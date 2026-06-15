import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import "./App.css";

interface LogEntry {
  timestamp: string;
  message: string;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), message: "Aether kernel initialized successfully." },
    { timestamp: new Date().toLocaleTimeString(), message: "Tauri Bridge listening on localhost..." }
  ]);

  async function greet() {
    if (!name.trim()) return;
    
    addLog(`Invoking Rust command 'greet' with parameter name: "${name}"`);
    
    try {
      const response = await invoke<string>("greet", { name });
      setGreetMsg(response);
      addLog(`Rust response received: "${response}"`);
    } catch (err) {
      addLog(`Error invoking Rust command: ${err}`);
    }
  }

  function addLog(message: string) {
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), message }
    ]);
  }

  const [currentVersion, setCurrentVersion] = useState("0.1.0");
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "no-update" | "downloading" | "error">("idle");
  const [updateError, setUpdateError] = useState("");
  const [updateInfo, setUpdateInfo] = useState<{ version: string; body?: string } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeUpdate, setActiveUpdate] = useState<any>(null);

  async function checkForUpdate(manual: boolean) {
    if (checking || updateStatus === "downloading") return;
    setChecking(true);
    setUpdateStatus("checking");
    if (manual) addLog("Checking for software updates...");
    
    try {
      const update = await check();
      if (update) {
        setUpdateInfo({ version: update.version, body: update.body });
        setCurrentVersion(update.currentVersion);
        setUpdateStatus("available");
        setActiveUpdate(update);
        addLog(`Update found: version ${update.version} (current: ${update.currentVersion})`);
      } else {
        setUpdateStatus("no-update");
        setActiveUpdate(null);
        if (manual) addLog("No updates available. Your app is up to date.");
      }
    } catch (err) {
      setUpdateStatus("error");
      setUpdateError(String(err));
      addLog(`Failed to check for updates: ${err}`);
    } finally {
      setChecking(false);
    }
  }

  async function installUpdate() {
    if (!activeUpdate) return;
    setUpdateStatus("downloading");
    addLog(`Initiating download and installation of version ${updateInfo?.version}...`);
    
    try {
      let downloaded = 0;
      let contentLength = 0;
      
      await activeUpdate.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            addLog(`Download started. Size: ${(contentLength / (1024 * 1024)).toFixed(2)} MB`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              const progress = Math.round((downloaded / contentLength) * 100);
              setDownloadProgress(progress);
            }
            break;
          case 'Finished':
            addLog("Download complete. Installing and restarting application...");
            break;
        }
      });
      
      await relaunch();
    } catch (err) {
      setUpdateStatus("error");
      setUpdateError(String(err));
      addLog(`Update installation failed: ${err}`);
    }
  }

  useEffect(() => {
    checkForUpdate(false);
  }, []);

  return (
    <>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      <div className="app-container">
        <header>
          <div className="brand">
            <svg className="brand-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 15L85 75H15L50 15Z" stroke="#00f2fe" strokeWidth="6" strokeLinejoin="round"/>
              <path d="M50 35L70 70H30L50 35Z" stroke="#4facfe" strokeWidth="4" strokeLinejoin="round"/>
              <circle cx="50" cy="58" r="6" fill="#f093fb"/>
            </svg>
            <span className="brand-name">AETHER</span>
          </div>
          
          <div className="system-status">
            <span className="status-dot"></span>
            <span>Tauri Core v2.0 Online</span>
          </div>
        </header>

        <main className="main-content">
          <section className="glass-card hero-card">
            <h1 className="hero-title">Welcome to Aether Desktop</h1>
            <p className="hero-subtitle">
              A premium, high-performance desktop application interface engineered with 
              <strong> Tauri v2</strong>, <strong>React 19</strong>, and <strong>Vite 7</strong>. Experience lightning-fast Rust-native performance wrapped in a modern, elegant web experience.
            </p>
            
            <div className="tech-logos">
              <a href="https://tauri.app" target="_blank" className="logo-wrapper" rel="noreferrer">
                <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
                <span>Tauri v2</span>
              </a>
              <a href="https://vite.dev" target="_blank" className="logo-wrapper" rel="noreferrer">
                <img src="/vite.svg" className="logo vite" alt="Vite logo" />
                <span>Vite v7</span>
              </a>
              <a href="https://react.dev" target="_blank" className="logo-wrapper" rel="noreferrer">
                <img src={reactLogo} className="logo react" alt="React logo" />
                <span>React v19</span>
              </a>
            </div>
          </section>

          <section className="glass-card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Rust Bridge Interaction</span>
            </div>
            
            <p className="card-desc" style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              Send a greeting request to the Rust backend handler. The data is processed natively and returned instantly.
            </p>

            <form
              className="form-group"
              onSubmit={(e) => {
                e.preventDefault();
                greet();
              }}
            >
              <div className="input-row">
                <input
                  id="greet-input"
                  className="fancy-input"
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Enter your name..."
                />
                <button type="submit" className="fancy-button">
                  Send to Rust
                </button>
              </div>
            </form>

            <div className={`result-box ${!greetMsg ? "empty" : ""}`}>
              {greetMsg ? greetMsg : "Awaiting response from native handler..."}
            </div>
          </section>

          <section className="glass-card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 12 12 16 14"/>
              </svg>
              <span>Software Update Engine</span>
            </div>
            
            <p className="card-desc" style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              Check for new releases, verify signature integrity, and install updates.
            </p>

            <div className="update-control-panel">
              <div className="update-meta">
                <div className="version-info">
                  Active Version: <span className="version-badge">v{currentVersion}</span>
                </div>
                
                <div className="status-info">
                  Status: {
                    updateStatus === "idle" && <span className="status-text">Ready</span>
                  }
                  {
                    updateStatus === "checking" && <span className="status-text pulse">Checking...</span>
                  }
                  {
                    updateStatus === "no-update" && <span className="status-text success">Up to date</span>
                  }
                  {
                    updateStatus === "available" && <span className="status-text warning">Update Available</span>
                  }
                  {
                    updateStatus === "downloading" && <span className="status-text info">Downloading ({downloadProgress}%)</span>
                  }
                  {
                    updateStatus === "error" && <span className="status-text danger">Check Failed</span>
                  }
                </div>
              </div>

              {updateStatus === "available" && updateInfo && (
                <div className="update-release-box">
                  <div className="release-header">New Release: v{updateInfo.version}</div>
                  {updateInfo.body && <div className="release-body">{updateInfo.body}</div>}
                </div>
              )}

              {updateStatus === "error" && (
                <div className="update-error-box">
                  Error: {updateError}
                </div>
              )}

              {updateStatus === "downloading" && (
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              )}

              <div className="action-buttons" style={{ display: "flex", gap: "10px" }}>
                <button 
                  type="button"
                  className="fancy-button secondary" 
                  onClick={() => checkForUpdate(true)}
                  disabled={checking || updateStatus === "downloading"}
                >
                  {checking ? "Checking..." : "Check for Updates"}
                </button>

                {updateStatus === "available" && (
                  <button 
                    type="button"
                    className="fancy-button success" 
                    onClick={installUpdate}
                  >
                    Install & Relaunch
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="glass-card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              <span>System & Action Logs</span>
            </div>
            
            <div className="console-log">
              {logs.map((log, idx) => (
                <div className="console-line" key={idx}>
                  <span className="console-timestamp">[{log.timestamp}]</span>
                  <span className="console-prompt">&gt;</span>
                  <span className="console-message">{log.message}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer>
          <div>© 2026 Aether OS Labs</div>
          <div className="tech-spec">
            <div className="spec-item">Backend: <span>Rust 1.96</span></div>
            <div className="spec-item">Frontend: <span>TSX / React</span></div>
            <div className="spec-item">Bundler: <span>Vite</span></div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
