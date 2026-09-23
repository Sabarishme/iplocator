'use client';
import React, { useState, useMemo } from 'react';
import { Globe, Search, Download, Trash2, RefreshCw, Wand2 } from 'lucide-react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to extract clean IP from a single line
  const extractCleanIP = (raw) => {
    let str = raw.trim();
    if (!str) return '';

    // Handle IPv6 in brackets: [2001:db8::1]:8080 -> 2001:db8::1
    if (str.includes('[')) {
      const match = str.match(/\[([a-fA-F0-9:]+)\]/);
      if (match) return match[1];
    }

    // Handle IPv4 with port: 103.101.54.181:58050 -> 103.101.54.181
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(str)) {
      return str.split(':')[0];
    }

    // Handle standard IPv6 with port: 2001:db8::1:8080 -> 2001:db8::1
    if (str.includes(':')) {
      const parts = str.split(':');
      if (parts.length > 2 && /^\d{1,5}$/.test(parts[parts.length - 1])) {
        parts.pop();
        return parts.join(':');
      }
    }

    return str;
  };

  // Feature: Cleans input in text box directly
  const handleCleanText = () => {
    const lines = inputText.split('\n');
    const cleanedList = lines
      .map(line => extractCleanIP(line))
      .filter(ip => ip.length > 0);
    
    setInputText(cleanedList.join('\n'));
  };

  // Real-time validation for status counters
  const { validIPs, invalidEntries } = useMemo(() => {
    const rawLines = inputText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const valid = [];
    const invalid = [];

    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$\vert{}^([0-9a-fA-F]{1,4}:){1,7}:\vert{}^:[0-9a-fA-F]{1,4}\vert{}(?::[0-9a-fA-F]{1,4}){1,7}$/;

    rawLines.forEach((line) => {
      const extracted = extractCleanIP(line);
      if (extracted && (ipv4Regex.test(extracted) || ipv6Regex.test(extracted))) {
        if (!valid.includes(extracted)) valid.push(extracted);
      } else {
        invalid.push(line);
      }
    });

    return { validIPs: valid, invalidEntries: invalid };
  }, [inputText]);

  const handleLookup = async () => {
    if (validIPs.length === 0) return;

    setLoading(true);
    setResults([]);

    const fetchedResults = [];
    for (const ip of validIPs) {
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
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <Globe className="w-7 h-7 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-wide">Bulk IP Geolocation Finder</h1>
          </div>
        </header>

        <div className="bg-[#0f172a]/60 border border-slate-800/80 rounded-xl p-6 space-y-5 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-md font-semibold text-slate-200">Paste Bulk IP Addresses</h2>
              <p className="text-xs text-slate-400">Accepts IPv4 and IPv6 addresses line-by-line.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCleanText}
                disabled={!inputText.trim()}
                className="text-xs bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 px-3 py-1.5 rounded-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" /> Clean IPs Only
              </button>
              <button
                onClick={() => setInputText(103.101.54.181:58050\n79.181.186.115:33945\n[2001:8a0:72fb:0:7d72:3e98:5f22:ebff]:9505)}
                className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 px-3 py-1.5 rounded-md transition"
              >
                Load Sample Data
              </button>
              <button
                onClick={() => { setInputText(''); setResults([]); }}
                className="text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            className="w-full bg-[#070a12] border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80"
            placeholder="Paste IPv4/IPv6 addresses here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={px-3 py-1.5 rounded-full border }>
                ? Valid IPs: {validIPs.length}
              </span>
              <span className={px-3 py-1.5 rounded-full border }>
                ?? Invalid Entries: {invalidEntries.length}
              </span>
            </div>

            <button
              onClick={handleLookup}
              disabled={loading || validIPs.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-md"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Fetching...' : 'Fetch Geolocation Data'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold text-slate-200">Results ({results.length})</h3>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#0f172a]/40 backdrop-blur-sm">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#070a12] text-slate-400 border-b border-slate-800 text-xs font-mono">
                  <tr>
                    <th className="p-3.5">IP Address</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Country</th>
                    <th className="p-3.5">City / Region</th>
                    <th className="p-3.5">Organization</th>
                    <th className="p-3.5">Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-mono text-indigo-300">{item.ip}</td>
                      <td className="p-3.5">
                        <span className={px-2 py-0.5 rounded text-xs }>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5">{item.country || '-'}</td>
                      <td className="p-3.5">{item.city ? ${item.city},  : '-'}</td>
                      <td className="p-3.5">{item.org || '-'}</td>
                      <td className="p-3.5 font-mono text-xs text-slate-400">{item.lat ? ${item.lat},  : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
