'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Download, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Moon, 
  Sun, 
  Server, 
  MapPin, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Terminal, 
  Layers, 
  HelpCircle,
  Code,
  Zap,
  Info,
  Check,
  Filter,
  ShieldCheck
} from 'lucide-react';

// Regex for strict IPv4 validation
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Regex for IPv6 validation (handles compressed formats as well)
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}$|^:(?::[0-9a-fA-F]{1,4}){1,7}$|^::$/;

// Sample IPs provided for easy testing
const SAMPLE_IPS = [
  '8.8.8.8',
  '1.1.1.1',
  '2001:4860:4860::8888',
  '104.16.249.249',
  '2606:4700:4700::1111',
  '13.224.0.0',
  'invalid-ip-address',
  '192.168.1.1',
  '185.199.108.153'
];

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(true);

  // Tab state: 'lookup' or 'deploy'
  const [activeTab, setActiveTab] = useState('lookup');

  // Input area states
  const [inputText, setInputText] = useState('');
  const [parsedValidIPs, setParsedValidIPs] = useState([]);
  const [parsedInvalidIPs, setParsedInvalidIPs] = useState([]);

  // Geolocation fetching & result states
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [activeModalItem, setActiveModalItem] = useState(null);

  // Table filtering and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, v4, v6
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to extract country flag emoji from 2-letter ISO country code
  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode === 'N/A') return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  useEffect(() => {
    // Extract strings separated by commas, spaces, or newlines
    const rawTokens = inputText
      .split(/[\s,\n]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const valid = [];
    const invalid = [];

    // Deduplicate tokens for accurate validation count
    const uniqueTokens = [...new Set(rawTokens)];

    uniqueTokens.forEach(token => {
      if (IPV4_REGEX.test(token)) {
        valid.push({ ip: token, type: 'IPv4' });
      } else if (IPV6_REGEX.test(token)) {
        valid.push({ ip: token, type: 'IPv6' });
      } else {
        invalid.push(token);
      }
    });

    setParsedValidIPs(valid);
    setParsedInvalidIPs(invalid);
  }, [inputText]);

  const handleLoadSample = () => {
    setInputText(SAMPLE_IPS.join('\n'));
    showToast('Loaded sample IPv4 and IPv6 addresses');
  };

  const handleClearInput = () => {
    setInputText('');
    setResults([]);
    showToast('Cleared inputs and results');
  };

  const handleStartLookup = async () => {
    if (parsedValidIPs.length === 0) {
      showToast('No valid IP addresses to look up!');
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: parsedValidIPs.length });
    const fetchedResults = [];

    for (let i = 0; i < parsedValidIPs.length; i++) {
      const item = parsedValidIPs[i];
      try {
        // Query ip-api.com (free HTTP CORS endpoint for batch/individual lookups)
        const response = await fetch(`https://ipapi.co/${item.ip}/json/`);
        
        let data;
        if (response.ok) {
          data = await response.json();
        } else {
          // Fallback to ip-api.com if ipapi.co rate limits
          const altResponse = await fetch(`http://ip-api.com/json/${item.ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
          data = await altResponse.json();
        }

        if (data.error || data.status === 'fail') {
          fetchedResults.push({
            ip: item.ip,
            type: item.type,
            status: 'error',
            message: data.reason || data.message || 'Lookup failed or reserved IP range',
            raw: data
          });
        } else {
          fetchedResults.push({
            ip: item.ip,
            type: item.type,
            status: 'success',
            country: data.country_name || data.country || 'Unknown',
            countryCode: data.country_code || data.countryCode || 'N/A',
            region: data.region || data.regionName || 'N/A',
            city: data.city || 'N/A',
            org: data.org || data.isp || 'N/A',
            asn: data.asn || data.as || 'N/A',
            lat: data.latitude || data.lat || 0,
            lon: data.longitude || data.lon || 0,
            timezone: data.timezone || 'UTC',
            raw: data
          });
        }
      } catch (err) {
        // Secondary fallback to free ip-api standard endpoint
        try {
          const fallbackRes = await fetch(`https://api.ipapi.is?q=${item.ip}`);
          const fallbackData = await fallbackRes.json();
          fetchedResults.push({
            ip: item.ip,
            type: item.type,
            status: fallbackData.is_bogon ? 'error' : 'success',
            country: fallbackData.location?.country || 'Unknown',
            countryCode: fallbackData.location?.country_code || 'N/A',
            region: fallbackData.location?.state || 'N/A',
            city: fallbackData.location?.city || 'N/A',
            org: fallbackData.company?.name || fallbackData.asn?.org || 'N/A',
            asn: fallbackData.asn?.asn ? `AS${fallbackData.asn.asn}` : 'N/A',
            lat: fallbackData.location?.latitude || 0,
            lon: fallbackData.location?.longitude || 0,
            timezone: fallbackData.location?.timezone || 'UTC',
            raw: fallbackData
          });
        } catch (e) {
          fetchedResults.push({
            ip: item.ip,
            type: item.type,
            status: 'error',
            message: 'Network request error or CORS block',
            raw: {}
          });
        }
      }

      // Update progress meter
      setProgress({ current: i + 1, total: parsedValidIPs.length });

      // Small delay to prevent aggressive rate limiting
      await new Promise(res => setTimeout(res, 250));
    }

    setResults(fetchedResults);
    setLoading(false);
    showToast(`Successfully processed ${fetchedResults.length} IP addresses`);
  };

  const filteredResults = useMemo(() => {
    return results.filter(item => {
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        item.ip.toLowerCase().includes(searchLower) ||
        (item.country && item.country.toLowerCase().includes(searchLower)) ||
        (item.city && item.city.toLowerCase().includes(searchLower)) ||
        (item.org && item.org.toLowerCase().includes(searchLower));

      return matchesType && matchesSearch;
    });
  }, [results, searchQuery, typeFilter]);

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(start, start + itemsPerPage);
  }, [filteredResults, currentPage]);

  const exportAsCSV = () => {
    if (results.length === 0) return;
    const headers = ['IP', 'Type', 'Status', 'Country', 'Country Code', 'Region', 'City', 'ISP/Org', 'Latitude', 'Longitude'];
    const csvRows = [headers.join(',')];

    results.forEach(r => {
      const row = [
        `"${r.ip}"`,
        `"${r.type}"`,
        `"${r.status}"`,
        `"${r.country || ''}"`,
        `"${r.countryCode || ''}"`,
        `"${r.region || ''}"`,
        `"${r.city || ''}"`,
        `"${r.org || ''}"`,
        `"${r.lat || ''}"`,
        `"${r.lon || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip_geolocation_export_${Date.now()}.csv`;
    a.click();
    showToast('Downloaded CSV Export');
  };

  const exportAsJSON = () => {
    if (results.length === 0) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip_geolocation_export_${Date.now()}.json`;
    a.click();
    showToast('Downloaded JSON Export');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-xl animate-bounce">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className={`border-b sticky top-0 z-40 backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Globe className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight flex items-center space-x-2">
                <span>Bulk IP Locator</span>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">v1.0</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">IPv4 & IPv6 Geolocation Parser and Batch Intelligence</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Navigation Tabs */}
            <nav className={`flex p-1 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setActiveTab('lookup')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'lookup'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search size={14} />
                <span>Tool</span>
              </button>
              <button
                onClick={() => setActiveTab('deploy')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'deploy'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Server size={14} />
                <span>Vercel Hosting Guide</span>
              </button>
            </nav>

            {/* Dark/Light Mode Switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition ${
                darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* TAB 1: BULK IP LOOKUP TOOL */}
        {activeTab === 'lookup' && (
          <div className="space-y-8">

            {/* Section 1: Input & Realtime Parser */}
            <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center space-x-2">
                    <Terminal className="text-indigo-500" size={20} />
                    <span>Paste Bulk IP Addresses</span>
                  </h2>
                  <p className="text-sm text-slate-400">Accepts IPv4 and IPv6 addresses separated by newlines, commas, or spaces.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleLoadSample}
                    className={`text-xs px-3 py-2 rounded-lg border font-medium flex items-center space-x-1 transition ${
                      darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Load Sample Data</span>
                  </button>
                  <button
                    onClick={handleClearInput}
                    className={`text-xs px-3 py-2 rounded-lg border font-medium flex items-center space-x-1 transition ${
                      darkMode ? 'border-red-900/30 bg-red-950/30 text-red-400 hover:bg-red-900/50' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 size={14} />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Textarea Input */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste IPs here (e.g.,&#10;8.8.8.8&#10;2001:4860:4860::8888, 1.1.1.1)"
                  rows={6}
                  className={`w-full p-4 font-mono text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Real-time Parser Summary */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/50 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs px-3 py-1.5 rounded-full border font-mono flex items-center space-x-1.5 ${
                    parsedValidIPs.length > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-800/40 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 size={14} />
                    <span>Valid IPs: {parsedValidIPs.length}</span>
                  </span>

                  <span className={`text-xs px-3 py-1.5 rounded-full border font-mono flex items-center space-x-1.5 ${
                    parsedInvalidIPs.length > 0 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-slate-800/40 border-slate-800 text-slate-500'
                  }`}>
                    <AlertCircle size={14} />
                    <span>Invalid Entries: {parsedInvalidIPs.length}</span>
                  </span>
                </div>

                <button
                  onClick={handleStartLookup}
                  disabled={loading || parsedValidIPs.length === 0}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all shadow-md ${
                    loading || parsedValidIPs.length === 0
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Processing ({progress.current}/{progress.total})...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      <span>Fetch Geolocation Data</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className="mt-4">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Results Table */}
            <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              
              {/* Table Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Layers className="text-indigo-500" size={20} />
                    <span>Lookup Results ({filteredResults.length})</span>
                  </h3>
                  <p className="text-sm text-slate-400">View geolocation, ISP details, and geographical mapping links.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search IP, Country, ISP..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className={`pl-9 pr-4 py-1.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* IPv4 / IPv6 Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="ALL">All Types</option>
                    <option value="IPv4">IPv4 Only</option>
                    <option value="IPv6">IPv6 Only</option>
                  </select>

                  {/* Export Options */}
                  <button
                    onClick={exportAsCSV}
                    disabled={results.length === 0}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border flex items-center space-x-1.5 transition ${
                      results.length === 0
                        ? 'opacity-40 cursor-not-allowed border-slate-800'
                        : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Download size={14} />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={exportAsJSON}
                    disabled={results.length === 0}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border flex items-center space-x-1.5 transition ${
                      results.length === 0
                        ? 'opacity-40 cursor-not-allowed border-slate-800'
                        : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Code size={14} />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                      <th className="p-3 font-semibold">IP Address</th>
                      <th className="p-3 font-semibold">Type</th>
                      <th className="p-3 font-semibold">Location</th>
                      <th className="p-3 font-semibold">ISP / ASN</th>
                      <th className="p-3 font-semibold">Coordinates</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {paginatedResults.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          {results.length === 0 
                            ? 'No lookups performed yet. Enter IP addresses above and click "Fetch Geolocation Data".' 
                            : 'No results match your search query or filter.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedResults.map((item, idx) => (
                        <tr key={idx} className={`transition ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                          {/* IP Address */}
                          <td className="p-3 font-mono font-medium text-indigo-400">
                            {item.ip}
                          </td>

                          {/* IP Type Badge */}
                          <td className="p-3">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                              item.type === 'IPv4'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            }`}>
                              {item.type}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="p-3">
                            {item.status === 'error' ? (
                              <span className="text-red-400 text-xs flex items-center space-x-1">
                                <AlertCircle size={12} />
                                <span>{item.message}</span>
                              </span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-base">{getFlagEmoji(item.countryCode)}</span>
                                <span className="font-medium text-slate-200">
                                  {item.city}, {item.region}, {item.country}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* ISP / ASN */}
                          <td className="p-3 text-xs text-slate-400 max-w-[200px] truncate">
                            {item.org || 'N/A'}
                          </td>

                          {/* Coordinates */}
                          <td className="p-3 font-mono text-xs text-slate-400">
                            {item.lat && item.lon ? `${item.lat}, ${item.lon}` : 'N/A'}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setActiveModalItem(item)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition"
                            >
                              Inspect Raw JSON
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                  <span>Showing page {currentPage} of {totalPages}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: VERCEL DEPLOYMENT & HOSTING GUIDE */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                  <Zap className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">How to Host This Tool on Vercel</h2>
                  <p className="text-sm text-slate-400">Follow this step-by-step developer deployment guide using Next.js / Vite React.</p>
                </div>
              </div>

              <div className="space-y-8">
                
                {/* Step 1 */}
                <div className="border-l-2 border-indigo-500 pl-4 space-y-2">
                  <span className="text-xs font-mono uppercase text-indigo-400 font-bold">Step 1</span>
                  <h3 className="font-semibold text-lg">Initialize Next.js / React Project</h3>
                  <p className="text-sm text-slate-300">Run the following command in your terminal to initialize a new Vite or Next.js app with Tailwind CSS:</p>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                    {`npm create vite@latest ip-location-tool -- --template react\ncd ip-location-tool\nnpm install lucide-react tailwindcss postcss autoprefixer`}
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="border-l-2 border-indigo-500 pl-4 space-y-2">
                  <span className="text-xs font-mono uppercase text-indigo-400 font-bold">Step 2</span>
                  <h3 className="font-semibold text-lg">Handling API Rate Limits & Proxy (Serverless Functions)</h3>
                  <p className="text-sm text-slate-300">
                    Free IP geolocation APIs (like ipapi.co or ip-api.com) impose rate limits (e.g., 45 requests/min) or block client-side CORS requests on HTTPS sites.
                    To bypass CORS or rate limits on Vercel, create a simple Serverless API proxy route at <code className="text-indigo-400 font-mono">/api/lookup.js</code>:
                  </p>
                  <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
{`// api/lookup.js (Vercel Serverless Function)
export default async function handler(req, res) {
  const { ip } = req.query;
  if (!ip) return res.status(400).json({ error: 'IP parameter is required' });

  try {
    const response = await fetch(\`https://ipapi.co/\${ip}/json/\`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch IP details' });
  }
}`}
                  </pre>
                </div>

                {/* Step 3 */}
                <div className="border-l-2 border-indigo-500 pl-4 space-y-2">
                  <span className="text-xs font-mono uppercase text-indigo-400 font-bold">Step 3</span>
                  <h3 className="font-semibold text-lg">Deploy to Vercel via CLI or GitHub</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                      <h4 className="font-semibold text-sm mb-2 flex items-center space-x-2">
                        <Terminal size={16} className="text-indigo-400" />
                        <span>Option A: Vercel CLI</span>
                      </h4>
                      <p className="text-xs text-slate-400 mb-3">Deploy directly from your command line terminal in seconds:</p>
                      <pre className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300">
{`npm i -g vercel\nvercel login\nvercel --prod`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                      <h4 className="font-semibold text-sm mb-2 flex items-center space-x-2">
                        <Globe size={16} className="text-indigo-400" />
                        <span>Option B: Vercel Web Dashboard</span>
                      </h4>
                      <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                        <li>Push your code to GitHub, GitLab, or Bitbucket.</li>
                        <li>Log in to <strong className="text-slate-200">vercel.com</strong> and click <strong className="text-slate-200">New Project</strong>.</li>
                        <li>Import your repository and hit <strong className="text-indigo-400">Deploy</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* API Key Best Practices */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start space-x-3">
                  <ShieldCheck size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-slate-100">Production Recommendation:</p>
                    <p>For high-volume commercial IP lookups, sign up for a commercial API key (e.g., ipinfo.io, ipgeolocation.io, maxmind) and store the key in Vercel's Environment Variables section (<code className="text-indigo-300 font-mono">VERCEL_API_KEY</code>).</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* JSON RAW INSPECT MODAL */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-lg flex items-center space-x-2">
                  <span>Inspection for {activeModalItem.ip}</span>
                  <span className="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {activeModalItem.type}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Raw Geolocation Response Output</p>
              </div>
              <button 
                onClick={() => setActiveModalItem(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg border border-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Map Link Preview */}
            {activeModalItem.lat && activeModalItem.lon && (
              <div className="my-4 p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-indigo-300">
                  <MapPin size={16} />
                  <span>GPS: {activeModalItem.lat}, {activeModalItem.lon}</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${activeModalItem.lat},${activeModalItem.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 font-medium transition"
                >
                  <span>Open Maps</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* JSON Viewer */}
            <div className="max-h-80 overflow-y-auto p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800">
              <pre>{JSON.stringify(activeModalItem.raw || activeModalItem, null, 2)}</pre>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
