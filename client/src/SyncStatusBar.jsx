export default function SyncStatusBar({
  online,
  pendingSyncCount,
  liteMode,
  syncState,
  syncMessage,
  lastSyncLabel,
  onSync
}) {
  return (
    <div className="sync-bar">
      <div className="sync-bar-left">
        <span className={online ? "network-dot online" : "network-dot offline"} />
        <span className="sync-bar-label">{online ? "Online" : "Offline"}</span>
        <span className="sync-bar-chip">{pendingSyncCount} pending</span>
        {liteMode && <span className="sync-bar-chip subtle">Lite mode</span>}
      </div>
      <div className="sync-bar-right">
        <span className="sync-bar-text">
          {syncState === "syncing" ? syncMessage : `${syncMessage} Last sync: ${lastSyncLabel}`}
        </span>
        <button
          type="button"
          className="btn btn-sync"
          onClick={onSync}
          disabled={!online || syncState === "syncing" || pendingSyncCount === 0}
        >
          {syncState === "syncing"
            ? "Syncing..."
            : pendingSyncCount > 0
              ? `Sync ${pendingSyncCount}`
              : "Up to Date"}
        </button>
      </div>
    </div>
  );
}
