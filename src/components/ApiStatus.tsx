import React, { useEffect, useState } from 'react';
import { getApiStatus } from '../lib/api';

interface ApiStatusData {
  status: string;
  message: string;
  version: string;
  timestamp: string;
}

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<ApiStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setLoading(true);
        const data = await getApiStatus();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError('Failed to connect to API. Make sure the Worker is deployed and running.');
        console.error('API Status error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkApiStatus();
    
    // Check status every 30 seconds
    const intervalId = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium mb-2">API Connection Status</h3>
      
      {loading ? (
        <p className="text-gray-500">Checking API connection...</p>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-3 rounded-md">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${status?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="font-medium">
              Status: <span className={status?.status === 'online' ? 'text-green-600' : 'text-red-600'}>{status?.status}</span>
            </p>
          </div>
          <p className="text-sm text-gray-600">{status?.message}</p>
          <p className="text-xs text-gray-500">Version: {status?.version}</p>
          <p className="text-xs text-gray-500">Last check: {new Date(status?.timestamp || '').toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default ApiStatus; 