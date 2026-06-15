import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import "./App.css";

interface LogEntry {
  timestamp: string;
  message: string;
}

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), message: "Aether kernel initialized successfully." },
    { timestamp: new Date().toLocaleTimeString(), message: "Ready for update check." }
  ]);
  const [currentVersion] = useState("0.2.0");
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "no-update" | "downloading" | "error">("idle");
  const [updateError, setUpdateError] = useState("");
  const [updateInfo, setUpdateInfo] = useState<{ version: string; body?: string } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeUpdate, setActiveUpdate] = useState<any>(null);

  function addLog(message: string) {
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), message }
    ]);
  }

  async function checkForUpdate(manual: boolean) {
    if (checking || updateStatus === "downloading") return;
    setChecking(true);
    setUpdateStatus("checking");
    if (manual) addLog("Checking for software updates...");
    
    try {
      const update = await check();
      if (update) {
        setUpdateInfo({ version: update.version, body: update.body });
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
      
      <div className="app-container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <main className="main-content" style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "600px", padding: "20px" }}>
          
          <section className="glass-card hero-card" style={{ textAlign: "center", padding: "30px" }}>
            <h1 className="hero-title" style={{ fontSize: "2.5rem", margin: "0 0 10px 0", background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              VERSI 2 (v0.2.0)
            </h1>
            <p className="hero-subtitle" style={{ fontSize: "1.05rem", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
              Aplikasi ini adalah Versi 2 yang sudah disederhanakan.
            </p>
          </section>

          <section className="glass-card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 8 12 12 16 14" />
              </svg>
              <span>Software Update Engine</span>
            </div>

            <div className="updater-panel" style={{ marginTop: "15px" }}>
              <div className="version-info" style={{ marginBottom: "15px" }}>
                Active Version: <span className="version-badge">v{currentVersion}</span>
              </div>

              <div className="status-info" style={{ marginBottom: "15px" }}>
                Status: {
                  updateStatus === "idle" && <span className="status-text">Ready</span>
                }
                {
                  updateStatus === "checking" && <span className="status-text pulse">Checking for updates...</span>
                }
                {
                  updateStatus === "available" && <span className="status-text success">Update Available (v{updateInfo?.version})</span>
                }
                {
                  updateStatus === "no-update" && <span className="status-text muted">Up to date</span>
                }
                {
                  updateStatus === "downloading" && <span className="status-text pulse">Downloading update: {downloadProgress}%</span>
                }
                {
                  updateStatus === "error" && <span className="status-text danger">Check Failed</span>
                }
              </div>

              {updateStatus === "downloading" && (
                <div className="progress-container" style={{ margin: "15px 0", background: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", height: "10px", overflow: "hidden" }}>
                  <div className="progress-bar" style={{ width: `${downloadProgress}%`, background: "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)", height: "100%", transition: "width 0.3s ease" }}></div>
                </div>
              )}

              {updateStatus === "error" && (
                <div className="error-panel" style={{ color: "#ff4d4d", fontSize: "0.9rem", margin: "10px 0" }}>
                  {updateError}
                </div>
              )}

              <div className="action-buttons" style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  type="button"
                  className="fancy-button secondary"
                  onClick={() => checkForUpdate(true)}
                  disabled={checking || updateStatus === "downloading"}
                >
                  {checking ? "Checking..." : "Check for Update"}
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              <span>System Logs</span>
            </div>
            <div className="console-log" style={{ maxHeight: "150px", overflowY: "auto", fontSize: "0.85rem", background: "rgba(0, 0, 0, 0.3)", padding: "10px", borderRadius: "8px", fontFamily: "monospace", marginTop: "10px" }}>
              {logs.map((log, idx) => (
                <div className="console-line" key={idx} style={{ marginBottom: "5px", color: "rgba(255, 255, 255, 0.8)" }}>
                  <span className="log-time" style={{ color: "#00f2fe", marginRight: "8px" }}>[{log.timestamp}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </>
  );
}

export default App;
