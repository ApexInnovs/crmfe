import React, { useEffect, useState, useRef } from 'react';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import {
  createCampaign,
  updateCampaign,
  getCampaignsByCompany,
  importLeadsFromFile, // NEW: POST /leads/import  { campaignId, leads: [...] }
} from '../../api/campigneAndLeadApi';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AddButton } from '../../components/common/Table';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 2, label: 'Started' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Cancelled' },
];

const STATUS_LABELS = { 1: 'Active', 2: 'Started', 3: 'Completed', 4: 'Cancelled' };
const STATUS_COLORS = {
  1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  2: 'bg-blue-100 text-blue-700 border-blue-200',
  3: 'bg-gray-100 text-gray-600 border-gray-200',
  4: 'bg-red-100 text-red-700 border-red-200',
};

const FIELD_TYPES = ['text', 'email', 'number', 'date', 'textarea', 'dropdown', 'radio', 'checkbox'];

// ─── Public campaign URL helper ───────────────────────────────────────────────
// Adjust BASE_URL to match your deployed frontend domain.
const BASE_URL = window.location.origin;
const getCampaignPublicUrl = (campaignId) =>
  `${BASE_URL}/campaign/${campaignId}`;

// ─── Icons ────────────────────────────────────────────────────────────────────

const EditIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z" />
  </svg>
);

const LinkIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 0 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ImportIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const CopyIcon = (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <path stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Excel/CSV parser (no external lib) ──────────────────────────────────────

/**
 * Very lightweight CSV → array-of-objects parser.
 * Handles quoted fields with commas inside.
 */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (cols[i] ?? '').trim();
    });
    return obj;
  });
}

function splitCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// ─── XLSX reader via SheetJS CDN (loaded lazily) ─────────────────────────────

async function ensureXLSX() {
  if (window.XLSX) return window.XLSX;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.XLSX;
}

async function parseExcel(file) {
  const XLSX = await ensureXLSX();
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ─── PDF text extractor via pdf.js CDN ────────────────────────────────────────

async function ensurePdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return window.pdfjsLib;
}

/**
 * Extract lines from PDF, then try to parse CSV-style or key:value style text.
 * Returns array of objects (best-effort).
 */
async function parsePdf(file) {
  const pdfjsLib = await ensurePdfJs();
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let fullText = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += content.items.map((i) => i.str).join(' ') + '\n';
  }
  // Attempt CSV parse first
  const trimmed = fullText.trim();
  if (trimmed.includes(',')) {
    const rows = parseCsv(trimmed);
    if (rows.length > 0) return rows;
  }
  // Fallback: each non-empty line as { raw_text }
  return trimmed
    .split('\n')
    .filter(Boolean)
    .map((line) => ({ raw_text: line.trim() }));
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

const ACCEPTED = '.csv,.xlsx,.xls,.pdf';


function ImportLeadsModal({ isOpen, onClose, campaigns, onImported }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1=select campaign, 2=upload, 3=preview, 4=done
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [externalCampaign, setExternalCampaign] = useState(false);
  const [externalCampaignName, setExternalCampaignName] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

  // reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedCampaign(''); setFile(null); setFileUrl('');
      setParsedRows([]); setParseError(''); setImportResult(null);
      setExternalCampaign(false); setExternalCampaignName('');
    }
  }, [isOpen]);

  // Helper to fetch and parse file from URL
  const handleUrlParse = async () => {
    setParseError('');
    setParsing(true);
    try {
      let rows = [];
      if (!fileUrl) throw new Error('Please enter a file URL.');
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error('Failed to fetch file from URL.');
      const urlLower = fileUrl.toLowerCase();
      if (urlLower.endsWith('.csv')) {
        const text = await res.text();
        rows = parseCsv(text);
      } else if (urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls')) {
        const blob = await res.blob();
        const file = new File([blob], 'import.xlsx');
        rows = await parseExcel(file);
      } else {
        throw new Error('Only .csv, .xlsx, .xls URLs supported.');
      }
      if (rows.length === 0) throw new Error('No data rows found in file.');
      setParsedRows(rows);
      setStep(3);
    } catch (err) {
      setParseError(err.message || 'Failed to parse file from URL.');
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParseError('');
    setParsing(true);
    try {
      let rows = [];
      if (f.name.endsWith('.csv')) {
        const text = await f.text();
        rows = parseCsv(text);
      } else if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
        rows = await parseExcel(f);
      } else if (f.name.endsWith('.pdf')) {
        rows = await parsePdf(f);
      }
      if (rows.length === 0) throw new Error('No data rows found in file.');
      setParsedRows(rows);
      setStep(3);
    } catch (err) {
      setParseError(err.message || 'Failed to parse file.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await importLeadsFromFile({
        campaignId: externalCampaign ? undefined : selectedCampaign,
        leads: parsedRows,
        company: user._id,
        createdBy: user._id,
      });
      setImportResult(result);
      setStep(4);
      onImported?.();
    } catch (err) {
      setParseError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const previewHeaders = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : [];
  const previewRows = parsedRows.slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-violet-50 to-white">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Import Leads</h2>
              <p className="text-xs text-gray-400">Upload Excel, CSV or PDF with client data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">{XIcon}</button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-6 pt-4">
          {['Select Campaign', 'Upload File', 'Preview', 'Done'].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-all
                  ${step > i + 1 ? 'bg-emerald-500 border-emerald-500 text-white'
                    : step === i + 1 ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-white border-gray-200 text-gray-400'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </span>
                <span className={`text-xs font-medium hidden sm:inline ${step === i + 1 ? 'text-violet-700' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${step > i + 1 ? 'bg-emerald-300' : 'bg-gray-100'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-55">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-2">Which campaign should these leads be linked to?</p>
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input type="checkbox" checked={externalCampaign} onChange={e => setExternalCampaign(e.target.checked)} />
                  Import for external/third-party campaign
                </label>
              </div>
              {!externalCampaign ? (
                <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                  {campaigns.map((c) => (
                    <button key={c._id} type="button"
                      onClick={() => { setSelectedCampaign(c._id); setStep(2); }}
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 transition-all hover:border-violet-400
                        ${selectedCampaign === c._id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white'}`}>
                      <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">
                        {c.title?.[0]?.toUpperCase() || 'C'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 truncate">{c.description || 'No description'}</p>
                      </div>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {STATUS_LABELS[c.status] || 'Unknown'}
                      </span>
                    </button>
                  ))}
                  {campaigns.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-6">No campaigns found. Create one first.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input label="External Campaign Name" value={externalCampaignName} onChange={e => setExternalCampaignName(e.target.value)} placeholder="e.g. Google Ads Campaign" />
                  <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg mt-2" disabled={!externalCampaignName.trim()} onClick={() => setStep(2)}>
                    Next: Upload/Import File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload your client data file or import from a URL. Supported: <strong>.xlsx, .xls, .csv, .pdf</strong>
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                {/* File upload */}
                <div className="flex-1">
                  <label
                    className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed border-violet-200 rounded-xl cursor-pointer bg-violet-50/40 hover:bg-violet-50 transition-colors group"
                    onClick={() => fileRef.current?.click()}
                  >
                    <span className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12" />
                      </svg>
                    </span>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-violet-700">Click to upload file</p>
                      <p className="text-xs text-gray-400 mt-0.5">Excel, CSV, or PDF — max 10 MB</p>
                    </div>
                    <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                {/* URL import */}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-500">Or import from file URL (.csv, .xlsx, .xls)</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    placeholder="Paste Excel/CSV file URL here"
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                  />
                  <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg mt-1" disabled={!fileUrl.trim() || parsing} onClick={handleUrlParse}>
                    {parsing ? 'Parsing…' : 'Import from URL'}
                  </button>
                </div>
              </div>
              {parsing && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                  <p className="text-sm text-gray-500">Parsing file…</p>
                </div>
              )}
              {parseError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  {parseError}
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Found <strong>{parsedRows.length}</strong> rows in <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{file?.name}</span>
                </p>
                <button type="button" onClick={() => { setFile(null); setParsedRows([]); setStep(2); }}
                  className="text-xs text-violet-600 hover:underline">Change file</button>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewHeaders.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        {previewHeaders.map((h) => (
                          <td key={h} className="px-3 py-2 text-gray-700 max-w-40 truncate border-b border-gray-100">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p className="text-xs text-gray-400 text-center">Showing 5 of {parsedRows.length} rows</p>
              )}
              {parseError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {parseError}
                </div>
              )}
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
              <span className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <path stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-base font-semibold text-gray-900">Import Successful!</p>
                <p className="text-sm text-gray-500 mt-1">
                  {importResult?.imported ?? parsedRows.length} leads have been added to your campaign.
                </p>
              </div>
              <button onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 3) && (
          <div className="flex justify-end gap-3 px-6 pb-5">
            <button type="button" onClick={() => setStep(2)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Back
            </button>
            <button type="button" onClick={handleImport} disabled={importing}
              className="px-5 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
              {importing && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {importing ? 'Importing…' : `Import ${parsedRows.length} Leads`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Campaign URL Modal ───────────────────────────────────────────────────────

function CampaignUrlModal({ isOpen, onClose, campaign }) {
  const [copied, setCopied] = useState(false);
  const url = campaign ? getCampaignPublicUrl(campaign._id) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 0 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Campaign Landing Page URL</h2>
              <p className="text-xs text-gray-400">Share this link in Google Ads, Meta Ads, etc.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">{XIcon}</button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Campaign info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
              {campaign.title?.[0]?.toUpperCase() || 'C'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{campaign.title}</p>
              <p className="text-xs text-gray-400">{campaign.formStructure?.length || 0} form fields</p>
            </div>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[campaign.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {STATUS_LABELS[campaign.status] || 'Unknown'}
            </span>
          </div>

          {/* URL box */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Public Form URL</label>
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl group">
              <span className="flex-1 text-sm text-blue-700 font-mono break-all select-all">{url}</span>
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0
                  ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 shadow-sm'}`}
              >
                {copied ? CheckIcon : CopyIcon}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* UTM helper */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
              Ad Platform Usage Tips
            </p>
            <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
              <li><strong>Google Ads:</strong> Paste as the Final URL in your ad group</li>
              <li><strong>Meta Ads:</strong> Use as Website URL in the ad creative</li>
              <li>Add UTM params: <code className="bg-blue-100 px-1 rounded">?utm_source=google&utm_campaign=...</code></li>
              <li>Leads submitted via this URL appear automatically in the <strong>Leads</strong> page</li>
            </ul>
          </div>

          {/* Open in new tab */}
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Preview Landing Page
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CompanyCampaigns = () => {
  const { user } = useAuth();
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);

  // NEW: import modal
  const [importModalOpen, setImportModalOpen] = useState(false);

  // NEW: URL modal
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlCampaign, setUrlCampaign] = useState(null);

  // NEW: success toast for created campaign URL
  const [newCampaignUrl, setNewCampaignUrl] = useState(null);

  const initialFields = { title: '', description: '', formStructure: [], status: 1 };
  const [modalFields, setModalFields] = useState(initialFields);

  const emptyField = { name: '', label: '', type: 'text', isRequired: false, placeholder: '', options: '' };
  const [newField, setNewField] = useState(emptyField);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('title');
  const [status, setStatus] = useState('');

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaignsByCompany(user._id, { page, limit: pageSize, search: searchText, status });
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setValues(items);
      setTotal(data.total || items.length);
    } catch (_) {
      setValues([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, [page, pageSize, searchText, status]);

  const handleAddField = () => {
    if (!newField.name.trim() || !newField.label.trim()) return;
    const field = {
      name: newField.name.trim(),
      label: newField.label.trim(),
      type: newField.type,
      isRequired: newField.isRequired,
      placeholder: newField.placeholder.trim(),
      options: ['dropdown', 'radio', 'checkbox'].includes(newField.type)
        ? newField.options.split(',').map(o => o.trim()).filter(Boolean)
        : [],
    };
    setModalFields(p => ({ ...p, formStructure: [...p.formStructure, field] }));
    setNewField(emptyField);
  };

  const handleSubmit = async () => {
    setModalLoading(true);
    try {
      const payload = {
        title: modalFields.title,
        description: modalFields.description,
        company: user._id,
        createdBy: user._id,
        formStructure: modalFields.formStructure.map(field => ({
          name: field.name,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          prefilledValue: field.prefilledValue || null,
          options: field.options || [],
          placeholder: field.placeholder || '',
        })),
        status: modalFields.status || 1,
      };

      if (editData) {
        await updateCampaign(editData._id, payload);
      } else {
        await createCampaign(payload);
      }
      setModalOpen(false);
      loadCampaigns();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save campaign');
      console.error('Error saving campaign:', e);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!rowToToggle) return;
    setLoading(true);
    try {
      const nextStatus = rowToToggle.status === 3 ? 1 : 3; // Completed <-> Active
      await updateCampaign(rowToToggle._id, { status: nextStatus });
    } finally {
      setConfirmModalOpen(false);
      setRowToToggle(null);
      loadCampaigns();
    }
  };

  const tableHeaders = [
    { key: 'title', label: 'Title', searchable: true },
    {
      key: 'description', label: 'Description',
      render: v => <span className="text-xs text-gray-500">{v || '—'}</span>,
    },
    {
      key: 'formStructure', label: 'Fields',
      render: v => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {Array.isArray(v) ? v.length : 0} fields
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      filter: { options: STATUS_OPTIONS, value: status, onChange: setStatus },
      render: v => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[v] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {STATUS_LABELS[v] || v || '—'}
        </span>
      ),
    },
    {
      key: '_id', label: 'Landing URL',
      render: (_, row) => {
        const isStarted = row.status === 2;
        return (
          <button
            type="button"
            title={isStarted ? 'View / Copy campaign URL' : 'URL available only when campaign is Started'}
            onClick={isStarted ? () => { setUrlCampaign(row); setUrlModalOpen(true); } : undefined}
            disabled={!isStarted}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border
              ${isStarted
                ? 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer'
                : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'}`}
          >
            {LinkIcon}
            Get URL
          </button>
        );
      },
    },
    { key: 'createdAt', label: 'Created', format: 'date' },
  ];

  // Helper to export leads as CSV
  const handleExportLeads = async (campaign) => {
    try {
      // You may want to fetch leads for the campaign from API here
      // For demo, just show a sample CSV
      const res = await fetch(`/api/leads?campaignId=${campaign._id}`); // Adjust API as needed
      if (!res.ok) throw new Error('Failed to fetch leads');
      const leads = await res.json();
      if (!Array.isArray(leads) || leads.length === 0) throw new Error('No leads found');
      const headers = Object.keys(leads[0]);
      const csv = [headers.join(',')].concat(leads.map(row => headers.map(h => '"' + String(row[h] ?? '').replace(/"/g, '""') + '"').join(','))).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign.title || 'leads'}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    } catch (e) {
      alert(e.message || 'Export failed');
    }
  };

  const actions = [
    {
      key: 'edit', label: 'Edit', icon: EditIcon,
      onClick: row => {
        setEditData(row);
        setModalFields({
          title: row.title || '',
          description: row.description || '',
          formStructure: row.formStructure || [],
          status: row.status || 1,
        });
        setNewField(emptyField);
        setModalOpen(true);
      },
    },
    {
      key: 'import', label: 'Import Leads', icon: ImportIcon,
      onClick: row => {
        setImportModalOpen(true);
      },
    },
    {
      key: 'export', label: 'Export Leads', icon: (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" /></svg>
      ),
      onClick: row => handleExportLeads(row),
    },
  ];


  // ─── Activity Timeline Panel ─────────────────────────────────────────────
  const activityTimelineData = [
    { type: 'created', message: 'Campaign "Spring Sale" created', time: '2026-03-28 10:12' },
    { type: 'import', message: '120 leads imported to "Spring Sale"', time: '2026-03-28 10:15' },
    { type: 'status', message: 'Campaign "Spring Sale" marked as Active', time: '2026-03-28 10:16' },
    { type: 'export', message: 'Leads exported from "Spring Sale"', time: '2026-03-28 10:20' },
    { type: 'edit', message: 'Campaign "Q2 Drive" edited', time: '2026-03-27 17:02' },
  ];

  const activityIcon = (type) => {
    switch (type) {
      case 'created': return <span className="text-green-600">●</span>;
      case 'import': return <span className="text-blue-600">⬆</span>;
      case 'export': return <span className="text-purple-600">⬇</span>;
      case 'edit': return <span className="text-yellow-600">✎</span>;
      case 'status': return <span className="text-emerald-600">★</span>;
      default: return <span className="text-gray-400">●</span>;
    }
  };

  return (
    <div className="p-2">
      <PageHeader
        title="Campaigns"
        actions={
          <div className="flex items-center gap-2">
            {/* Import Leads button styled like AddButton but violet */}
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '11px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#3b0764', letterSpacing: '0.01em', whiteSpace: 'nowrap', border: 'none', background: 'linear-gradient(160deg, #e9d5ff 0%, #a78bfa 40%, #7c3aed 100%)', borderTop: '1px solid rgba(255,255,255,0.45)', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #7c3aed, 0 5px 6px rgba(124,58,237,0.25), 0 10px 20px rgba(168,139,250,0.15)', transition: 'all 0.15s ease', }}
              onClick={() => setImportModalOpen(true)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 5px 0 #7c3aed, 0 7px 10px rgba(124,58,237,0.30), 0 14px 24px rgba(168,139,250,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #7c3aed, 0 5px 6px rgba(124,58,237,0.25), 0 10px 20px rgba(168,139,250,0.15)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12) inset, 0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 0 #7c3aed'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 5px 0 #7c3aed, 0 7px 10px rgba(124,58,237,0.30)'; }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Leads
            </button>
            <AddButton onAdd={() => {
              setEditData(null);
              setModalFields(initialFields);
              setNewField(emptyField);
              setModalOpen(true);
            }} addLabel={" New Campaign"} />
          </div>
        }
      />

      <Table
        headers={tableHeaders} values={values} total={total} page={page} pageSize={pageSize}
        searchKeys={['title']} searchKey={searchKey} onSearchKeyChange={setSearchKey}
        searchText={searchText} onSearchTextChange={setSearchText}
        loading={loading} onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        actions={actions}
      />

      {/* ── Activity Timeline Panel ── */}
      <div className="mt-8 mb-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Activity Timeline</h3>
        <ul className="divide-y divide-gray-100">
          {activityTimelineData.map((a, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="text-lg">{activityIcon(a.type)}</span>
              <span className="flex-1 text-sm text-gray-700">{a.message}</span>
              <span className="text-xs text-gray-400 font-mono">{a.time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Add/Edit Campaign Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Campaign' : 'Create Campaign'}
        size="lg"
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button type="button"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="campaign-form"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm">
                {editData ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          )
        }
      >
        {modalLoading
          ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          : (
            <form id="campaign-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Campaign Title" name="title" placeholder="e.g. Q1 Lead Drive"
                  value={modalFields.title}
                  onChange={e => setModalFields(p => ({ ...p, title: e.target.value }))} required />
                {/* Status dropdown only in edit mode */}
                {editData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={modalFields.status}
                      onChange={e => setModalFields(p => ({ ...p, status: Number(e.target.value) }))}
                    >
                      {STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <Input label="Description" name="description" type="textarea"
                placeholder="What is this campaign about?"
                value={modalFields.description}
                onChange={e => setModalFields(p => ({ ...p, description: e.target.value }))} />

              {/* Form Builder */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">
                  Lead Capture Form Fields
                </h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Input label="Field Key" name="fname" placeholder="e.g. phone_number"
                      value={newField.name} onChange={e => setNewField(p => ({ ...p, name: e.target.value }))} />
                    <Input label="Display Label" name="flabel" placeholder="e.g. Phone Number"
                      value={newField.label} onChange={e => setNewField(p => ({ ...p, label: e.target.value }))} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Field Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newField.type}
                        onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <Input label="Placeholder" name="fplaceholder" placeholder="Optional hint"
                      value={newField.placeholder} onChange={e => setNewField(p => ({ ...p, placeholder: e.target.value }))} />
                    {['dropdown', 'radio', 'checkbox'].includes(newField.type) && (
                      <Input label="Options (comma-separated)" name="foptions" placeholder="Yes, No, Maybe"
                        value={newField.options} onChange={e => setNewField(p => ({ ...p, options: e.target.value }))} />
                    )}
                    <div className="flex items-center gap-2 mt-6">
                      <input type="checkbox" id="isReq" checked={newField.isRequired}
                        onChange={e => setNewField(p => ({ ...p, isRequired: e.target.checked }))}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <label htmlFor="isReq" className="text-sm text-gray-700 cursor-pointer select-none">Required</label>
                    </div>
                  </div>
                  <button type="button" onClick={handleAddField}
                    className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 transition-colors">
                    + Add Field
                  </button>

                  {modalFields.formStructure.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {modalFields.formStructure.map((field, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">{field.type}</span>
                            <span className="text-sm font-medium text-gray-800 truncate">{field.label}</span>
                            <span className="text-xs text-gray-400 hidden sm:inline truncate">{field.name}</span>
                            {field.isRequired && <span className="text-xs text-red-500 font-medium shrink-0">*</span>}
                          </div>
                          <button type="button"
                            onClick={() => setModalFields(p => ({ ...p, formStructure: p.formStructure.filter((_, i) => i !== idx) }))}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 ml-2 shrink-0">
                            {XIcon}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {modalFields.formStructure.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No fields added yet.</p>
                  )}
                </div>
              </div>

              {/* ── NEW: note about URL generation ── */}
              {!editData && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                  <svg className="shrink-0 mt-0.5" width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  After creating this campaign, a <strong>public landing page URL</strong> will be generated automatically. Use it in Google Ads, Meta Ads, or any other ad platform to capture leads directly into this campaign.
                </div>
              )}
            </form>
          )}
      </Modal>

      {/* ── Confirm Toggle Modal ── */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setRowToToggle(null); }}
        onConfirm={handleToggleStatus}
        title="Change Status"
        message={<>Change status for <span className="font-semibold">"{rowToToggle?.title}"</span>?</>}
        confirmLabel="Confirm"
      />

      {/* ── Import Leads Modal ── */}
      <ImportLeadsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        campaigns={values}
        onImported={loadCampaigns}
      />

      {/* ── Campaign URL Modal ── */}
      <CampaignUrlModal
        isOpen={urlModalOpen}
        onClose={() => { setUrlModalOpen(false); setUrlCampaign(null); }}
        campaign={urlCampaign}
      />
    </div>
  );
};

export default CompanyCampaigns;