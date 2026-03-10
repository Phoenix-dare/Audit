import useOnlineStatus from "./useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="offline-banner" role="status">
      Offline mode: showing last cached data.
    </div>
  );
}
