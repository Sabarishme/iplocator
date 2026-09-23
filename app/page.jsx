'use client';
import React, { useState } from 'react';
import { Globe, Search, Download, Trash2, RefreshCw } from 'lucide-react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const parseLineByLine = (text) => {
    const lines = text.split('\n');
    const cleanedIPs = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      let ip = line;

      // Handle IPv6 inside brackets with port: [2800:300::1]:6692
      if (line.startsWith('[')) {
        const match = line.match(/^\[([a-fA-F0-9:]+)\](?::\d+)?$/);
        if (match) {
          ip = match[1];
        }
      } 
      // Handle IPv4 with port: 122.60.224.71:38976
      else if (line.includes('.')) {
        ip = line.split(':')[0];
      }
      // Handle standard IPv6 with port: 2001:db8::1:8080
      else if (line.includes(':')) {
        const parts = line.split(':');
        // If last part is a port number (5 digits or fewer)
        if (parts.length > 2 && /^\d{1,5}$/.test(parts[parts.length - 1])) {
          parts.pop();
          ip = parts.join(':');
        }
      }

      if (ip && !cleanedIPs.includes(ip)) {
        cleanedIPs.push(ip);
      }
    }

    return cleanedIPs;
  };

  const handleLookup = async () => {
    const ipList = parseLineByLine(inputText);
    if (ipList.length === 0) {
      alert('No valid IP addresses found line-by-line!');
      return;
    }

    setLoading(true);
    setResults([]);

    const fetchedResults = [];
    for (const ip of ipList) {
      try {
        const res = await fetch(https://ipapi.co//json/);
        const data = await res.json();
        if (data.error) {
          fetchedResults.push({ ip, status: 'Error', message: data.reason || 'Failed' });
        } else {
          fetchedResults.push({
            ip,
            status: 'Success',
            country: data.country_name,
            city: data.city,
            region: data.region,
            org: data.org || data.asn,
            lat: data.latitude,
            lon: data.longitude
          });
        }
      } catch (err) {
        fetchedResults.push({ ip, status: 'Error', message: 'Network error' });
      }
    }

    setResults(fetchedResults);
    setLoading(false);
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const headers = 'IP,Status,Country,Region,City,Organization,Latitude,Longitude\n';
    const rows = results.map(r => 
      "","","","","","","",""
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ip_locations.csv';
    a.click();
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center gap-3 border-b border-slate-800 pb-6">
          <Globe className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight">Bulk IP Geolocation Finder</h1>
        </header>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-400">
            Paste IPs line-by-line (one per line):
          </label>
          <textarea
            rows={10}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={122.60.224.71:38976\n[2800:300:6a13:2400:1525:346b:6388:213e]:6692\n31.217.177.134:12833}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              onClick={handleLookup}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Processing...' : 'Lookup Locations'}
            </button>
            <button
              onClick={() => { setInputText(''); setResults([]); }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
            {results.length > 0 && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">City / Region</th>
                  <th className="p-3">Organization</th>
                  <th className="p-3">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-indigo-300">{item.ip}</td>
                    <td className="p-3">
                      <span className={px-2 py-1 rounded text-xs }>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">{item.country || '-'}</td>
                    <td className="p-3">{item.city ? ${item.city},  : '-'}</td>
                    <td className="p-3">{item.org || '-'}</td>
                    <td className="p-3 font-mono text-xs">{item.lat ? ${item.lat},  : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
