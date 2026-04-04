import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import { SkeletonLoader } from '../../components/common/Skeleton';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import useFeedback from '../../hooks/useFeedback';
import {
  createCampaign,
  updateCampaign,
  getCampaignsByCompany,
  importLeadsFromFile, // NEW: POST /leads/import  { campaignId, leads: [...] }
  deleteCampaign,
} from '../../api/campigneAndLeadApi';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
    <path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 0 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ImportIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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

const TrashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
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
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      {/* Gradient backdrop base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))',
        }}
      />

      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: 'url(#modal-grain)',
          opacity: 1,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Click to close */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />

      <style>{`
        @keyframes modalEntrance { 
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .modal-content {
          animation: modalEntrance 0.36s cubic-bezier(0.34, 1.3, 0.64, 1) both;
        }
        
        .modal-section {
          animation: slideInUp 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
        
        .modal-section:nth-child(1) { animation-delay: 0.08s; }
        .modal-section:nth-child(2) { animation-delay: 0.14s; }
        .modal-section:nth-child(3) { animation-delay: 0.20s; }
        .modal-section:nth-child(4) { animation-delay: 0.26s; }
      `}</style>

      {/* Modal content */}
      <div className="modal-content relative bg-white rounded-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col"
        style={{
          border: '1px solid rgba(200, 200, 200, 0.25)',
          borderTop: '4px solid #84cc16',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}>
        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-white shrink-0 relative" style={{
          backgroundImage: 'radial-gradient(circle, rgba(180, 190, 175, 0.4) 2.5px, transparent 2.5px)',
          backgroundSize: '12px 2px',
          backgroundPosition: '0 100%',
          backgroundRepeat: 'repeat-x',
          borderBottom: 'none',
          paddingBottom: 'calc(0.75rem + 4px)'
        }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, #f0fce8 0%, #e8fad1 100%)',
                  border: '1px solid #d1faa0',
                  cursor: 'default',
                }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 0 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">
                  Campaign Landing Page URL
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-gray-400 hover:text-gray-700 transition-all duration-200 cursor-pointer rounded-full shrink-0"
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '20px'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.1)'; e.currentTarget.style.color = '#336633'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
            >
              {XIcon}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-3 overflow-y-auto flex-1" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          {/* Campaign info */}
          <div className="modal-section flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:shadow-md"
            style={{
              background: 'linear-gradient(135deg, #fafbfc 0%, #f3f6f1 100%)',
              border: '1.5px solid #e5e7e0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'default',
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-transform duration-300"
              style={{
                background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
                color: '#1a3a00',
                boxShadow: '0 2px 4px rgba(101,163,13,0.2)',
              }}>
              {campaign.title?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{campaign.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{campaign.formStructure?.length || 0} form fields</p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 11px',
                borderRadius: '8px',
                flexShrink: 0,
                transition: 'all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1)',
                letterSpacing: '0.3px',
                textTransform: 'capitalize',
                ...(campaign.status === 1 ? {
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  color: '#166534',
                  border: '1px solid #86efac',
                  boxShadow: '0 2px 4px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                } : campaign.status === 2 ? {
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  color: '#1e40af',
                  border: '1px solid #93c5fd',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                } : campaign.status === 3 ? {
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 2px 4px rgba(75, 85, 99, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                } : {
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  color: '#991b1b',
                  border: '1px solid #fca5a5',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                }),
              }}
              className="hover:scale-105 hover:shadow-md cursor-default"
            >
              {STATUS_LABELS[campaign.status] || 'Unknown'}
            </span>
          </div>

          {/* URL box */}
          <div className="modal-section">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ color: '#a1a1aa', letterSpacing: '0.09em' }}>Public Form URL</label>
            <div className="flex items-center gap-2 p-3 rounded-xl transition-all duration-300 group focus-within:ring-2 focus-within:ring-lime-400"
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e5e7eb',
              }}>
              <span className="flex-1 text-sm font-mono break-all select-all transition-colors duration-200"
                style={{ color: '#000000', fontWeight: 500, lineHeight: 1.5 }}>
                {url}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0',
                  padding: '6px 8px', flexShrink: 0,
                  borderRadius: '7px', border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.3, 0.64, 1)',
                  ...(copied
                    ? { background: 'linear-gradient(135deg, #f0fce8, #e8fad1)', boxShadow: '0 1px 3px rgba(101,163,13,0.15)' }
                    : { background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)', boxShadow: '0 2px 4px rgba(101,163,13,0.2)' }
                  ),
                }}
                onMouseEnter={e => { if (!copied) { e.currentTarget.style.boxShadow = '0 4px 8px rgba(101,163,13,0.28)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { if (!copied) { e.currentTarget.style.boxShadow = '0 2px 4px rgba(101,163,13,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                {copied ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Preview button */}
          <a
            href={url} target="_blank" rel="noopener noreferrer"
            className="modal-section"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px', fontWeight: 600, color: '#1a3a00',
              textDecoration: 'none',
              background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
              border: 'none',
              boxShadow: '0 2px 6px rgba(101,163,13,0.22)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              marginTop: '8px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(132, 204, 22, 0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(101,163,13,0.35)';
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(101,163,13,0.22)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
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
  const { fire } = useFeedback();
  const hapticTap = () => fire({ haptic: [{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }], sound: true });
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
  const [inputSearch, setInputSearch] = useState('');
  const [searchKey, setSearchKey] = useState('title');
  const [status, setStatus] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const searchDebounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setInputSearch(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setSearchText(val);
    }, 350);
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    setPage(1);
  };

  // loadCampaigns is used imperatively after create/delete — all params explicit
  const loadCampaigns = () => setRefreshTick(t => t + 1);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await getCampaignsByCompany(user._id, {
          page, limit: pageSize, search: searchText, status,
        });
        if (cancelled) return;
        const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setValues(items);
        setTotal(data.total ?? items.length);
      } catch (_) {
        if (!cancelled) { setValues([]); setTotal(0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [user?._id, page, pageSize, searchText, status, refreshTick]);

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
        toast.success('Campaign updated successfully!');
      } else {
        await createCampaign(payload);
        toast.success('Campaign created successfully!');
      }
      setModalOpen(false);
      loadCampaigns();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save campaign');
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
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-br from-lime-50 to-lime-100 text-lime-700 border border-lime-200 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default"
          style={{
            boxShadow: '0 0 16px rgba(132, 204, 22, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          }}
        >
          <span className="w-2 h-2 rounded-full bg-lime-500" style={{ boxShadow: '0 0 6px rgba(132, 204, 22, 0.5)' }} />
          {Array.isArray(v) ? v.length : 0} fields
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      filter: { options: STATUS_OPTIONS, value: status, onChange: handleStatusChange },
      render: v => {
        const statusStyles = {
          1: { label: 'Active', bgGradient: 'from-rose-50 to-rose-100', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500', glow: 'rgba(239, 68, 68, 0.15)' },
          2: { label: 'Started', bgGradient: 'from-emerald-50 to-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500', glow: 'rgba(16, 185, 129, 0.15)' },
          3: { label: 'Completed', bgGradient: 'from-slate-50 to-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400', glow: 'rgba(100, 116, 139, 0.15)' },
          4: { label: 'Cancelled', bgGradient: 'from-red-50 to-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500', glow: 'rgba(239, 68, 68, 0.15)' },
        };
        const style = statusStyles[v] || statusStyles[1];
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-br ${style.bgGradient} ${style.text} border ${style.border} transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default`}
            style={{
              boxShadow: `0 0 16px ${style.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`
            }}
          >
            <span className={`w-2 h-2 rounded-full ${style.dot}`} style={{ boxShadow: `0 0 6px ${style.glow}` }} />
            {style.label}
          </span>
        );
      },
    },
    {
      key: 'createdAt', label: 'Created',
      render: v => {
        if (!v) return '—';
        const date = new Date(v);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    },
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
        hapticTap();
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
      key: 'link', label: 'Get Link', icon: LinkIcon,
      onClick: row => {
        hapticTap();
        setUrlCampaign(row);
        setUrlModalOpen(true);
      },
    },
    {
      key: 'import', label: 'Import Leads', icon: ImportIcon,
      onClick: row => {
        hapticTap();
        setImportModalOpen(true);
      },
    },
    {
      key: 'export', label: 'Export Leads', icon: (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" /></svg>
      ),
      onClick: row => { hapticTap(); handleExportLeads(row); },
    },
    {
      key: 'delete', label: 'Delete', icon: TrashIcon, variant: 'danger',
      onClick: row => {
        hapticTap();
        setRowToDelete(row);
        setDeleteConfirmOpen(true);
      },
    },
  ];

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteCampaign(rowToDelete._id);
      setDeleteConfirmOpen(false);
      setRowToDelete(null);
      loadCampaigns();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete campaign');
      console.error('Delete campaign error', e);
    } finally {
      setDeleteLoading(false);
    }
  };




  return (
    <div className="px-2">
      {/* Header with search and buttons */}
      <div style={{
        background: 'linear-gradient(160deg, #ffffff 0%, #f5f7f4 100%)',
        borderRadius: '16px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
        border: '1px solid rgba(200,210,195,0.7)',
        boxShadow: '0 1px 0 0 rgba(255,255,255,0.9) inset, 0 -1px 0 0 rgba(0,0,0,0.06) inset, 0 4px 6px -2px rgba(0,0,0,0.05), 0 12px 28px -6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08)',
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9aaa98', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={inputSearch}
            onChange={handleSearchChange}
            style={{
              padding: '9px 14px 9px 36px',
              background: 'linear-gradient(175deg, #f4f6f3 0%, #ffffff 100%)',
              borderRadius: '10px',
              border: '1px solid rgba(180,190,175,0.5)',
              fontFamily: 'inherit',
              fontSize: '13.5px',
              color: '#374140',
              outline: 'none',
              width: '260px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)',
              transition: 'all 0.2s ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(132,204,22,0.5)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04) inset, 0 0 0 3px rgba(132,204,22,0.12), 0 1px 0 rgba(255,255,255,0.8)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(180,190,175,0.5)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)';
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => { hapticTap(); setImportModalOpen(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '11px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#4a1a6b',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              position: 'relative',
              border: 'none',
              background: 'linear-gradient(160deg, #f0d4f5 0%, #e8b8f0 40%, #dd7bdf 100%)',
              borderTop: '1px solid rgba(255,255,255,0.45)',
              borderBottom: '1px solid rgba(0,0,0,0.15)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #b84fbf, 0 5px 6px rgba(184,79,191,0.35), 0 10px 20px rgba(221,123,223,0.20)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 5px 0 #b84fbf, 0 7px 10px rgba(184,79,191,0.40), 0 14px 24px rgba(221,123,223,0.22)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #b84fbf, 0 5px 6px rgba(184,79,191,0.35), 0 10px 20px rgba(221,123,223,0.20)';
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = 'translateY(3px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12) inset, 0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 0 #b84fbf, 0 2px 4px rgba(184,79,191,0.25)';
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 5px 0 #b84fbf, 0 7px 10px rgba(184,79,191,0.40), 0 14px 24px rgba(221,123,223,0.22)';
            }}
          >
            Import Leads
          </button>
          <button
            onClick={() => {
              hapticTap();
              setEditData(null);
              setModalFields(initialFields);
              setNewField(emptyField);
              setModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '11px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#1a3a00',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              position: 'relative',
              border: 'none',
              background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
              borderTop: '1px solid rgba(255,255,255,0.45)',
              borderBottom: '1px solid rgba(0,0,0,0.15)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #4d7c0f, 0 5px 6px rgba(74,120,8,0.35), 0 10px 20px rgba(101,163,13,0.20)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40), 0 14px 24px rgba(101,163,13,0.22)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #4d7c0f, 0 5px 6px rgba(74,120,8,0.35), 0 10px 20px rgba(101,163,13,0.20)';
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = 'translateY(3px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12) inset, 0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 0 #4d7c0f, 0 2px 4px rgba(74,120,8,0.25)';
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40), 0 14px 24px rgba(101,163,13,0.22)';
            }}
          >
            New Campaign
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader
          rows={pageSize}
          columns={7}
          columnWidths={['40px', '1fr', '2fr', '110px', '120px', '140px', '160px']}
          isMultiLine={[false, false, true, false, false, false, false]}
        />
      ) : (
        <Table
          headers={tableHeaders} values={values} total={total} page={page} pageSize={pageSize}
          loading={false} onPageChange={setPage}
          onPageSizeChange={size => { setPageSize(size); setPage(1); }}
          actions={actions}
        />
      )}


      {/* ── Add/Edit Campaign Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !modalLoading && setModalOpen(false)}
        title={editData ? 'Edit Campaign' : 'Create Campaign'}
        size="lg"
        icon={
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-lime-100 to-lime-50 flex items-center justify-center shrink-0 border border-lime-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-700">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </div>
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={modalLoading}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => { hapticTap(); setModalOpen(false); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="campaign-form"
              disabled={modalLoading}
              style={{
                padding: '6px 16px', fontSize: '13px', fontWeight: '600', color: '#1a3a00',
                border: 'none', borderRadius: '6px', cursor: modalLoading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
                boxShadow: '0 2px 6px rgba(101,163,13,0.2)', transition: 'all 0.25s ease',
                opacity: modalLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px',
              }}
              onClick={() => !modalLoading && hapticTap()}
              onMouseEnter={e => { if (!modalLoading) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(101,163,13,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!modalLoading) { e.currentTarget.style.boxShadow = '0 2px 6px rgba(101,163,13,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {modalLoading && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              )}
              <span>{modalLoading ? (editData ? 'Saving...' : 'Creating...') : (editData ? 'Save Changes' : 'Create Campaign')}</span>
            </button>
          </div>
        }
      >
        <form id="campaign-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '2px' }}>

          {/* ══════ Section 1: Core Campaign Info ══════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Title + Status row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {/* Title field */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '6px', letterSpacing: '0.4px' }}>Campaign Title</div>
                <Input
                  name="title"
                  placeholder="e.g. Q1 Lead Drive"
                  value={modalFields.title}
                  onChange={e => setModalFields(p => ({ ...p, title: e.target.value }))}
                  disabled={modalLoading}
                  required
                />
              </div>

              {/* Status field (edit mode only) */}
              {editData && (
                <div style={{ flex: '0 0 130px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '6px', letterSpacing: '0.4px' }}>Status</div>
                  <select
                    style={{ width: '100%', padding: '9px 18px', borderRadius: '8px', border: '2px solid #e5e7eb', outline: 'none', fontSize: '13px', color: '#111827', backgroundColor: '#fafbfc', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.2s ease', cursor: 'pointer', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
                    value={modalFields.status}
                    onChange={e => setModalFields(p => ({ ...p, status: Number(e.target.value) }))}
                    disabled={modalLoading}
                    onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.12), inset 0 1px 2px rgba(0,0,0,0.05)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)'; }}
                  >
                    {STATUS_OPTIONS.filter(o => o.value !== '').map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Description field */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '6px', letterSpacing: '0.4px' }}>Description</div>
              <textarea
                rows={3}
                placeholder="What is this campaign about? (Optional context for the team)"
                value={modalFields.description}
                onChange={e => setModalFields(p => ({ ...p, description: e.target.value }))}
                disabled={modalLoading}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', outline: 'none', fontSize: '13px', color: '#111827', backgroundColor: '#fafbfc', fontFamily: 'inherit', fontWeight: 400, resize: 'vertical', minHeight: '72px', maxHeight: '140px', transition: 'all 0.2s ease', boxSizing: 'border-box', lineHeight: '1.6', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
                onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.12), inset 0 1px 2px rgba(0,0,0,0.05)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)'; }}
              />
            </div>
          </div>

          {/* ═══ Visual Divider ═══ */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #e5e7eb, #f3f4f6, #e5e7eb)', margin: '4px 0' }} />

          {/* ══════ Section 2: Lead Capture Form ══════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '2px' }}>
              <span style={{ background: 'linear-gradient(135deg, #84cc16, #65a30d)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>Lead Capture Fields</span>
            </div>

            {/* Field builder section */}
            <div style={{ background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)', border: '1.5px solid #e9ecef', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

              {/* Input row with labels */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {[
                  { key: 'name', label: 'Field Key', placeholder: 'e.g. phone_number', flex: '1 1 100px', minWidth: '90px' },
                  { key: 'label', label: 'Label', placeholder: 'e.g. Phone Number', flex: '1 1 100px', minWidth: '90px' },
                  { key: 'type', label: 'Type', placeholder: 'text', isSelect: true, flex: '0 0 95px' },
                  { key: 'placeholder', label: 'Placeholder', placeholder: 'optional', flex: '1 1 90px', minWidth: '80px' },
                ].map(({ key, label, placeholder, flex, minWidth, isSelect }) => (
                  <div key={key} style={{ flex, minWidth: minWidth || '70px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px', opacity: 0.9 }}>{label}</label>
                    {isSelect ? (
                      <select
                        style={{ width: '100%', padding: '7px 9px', fontSize: '12px', fontWeight: 500, border: '1.5px solid #d1d5db', borderRadius: '7px', outline: 'none', color: '#111827', backgroundColor: '#fff', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)' }}
                        value={newField.type}
                        onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}
                        disabled={modalLoading}
                        onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 2px rgba(132,204,22,0.15), inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                      >
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <input
                        style={{ width: '100%', padding: '7px 9px', fontSize: '12px', fontWeight: 500, border: '1.5px solid #d1d5db', borderRadius: '7px', outline: 'none', color: '#111827', backgroundColor: '#fff', fontFamily: 'inherit', transition: 'all 0.15s ease', boxSizing: 'border-box', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)' }}
                        type="text"
                        placeholder={placeholder}
                        value={newField[key] || ''}
                        onChange={e => setNewField(p => ({ ...p, [key]: e.target.value }))}
                        disabled={modalLoading}
                        onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 2px rgba(132,204,22,0.15), inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                      />
                    )}
                  </div>
                ))}

                {/* Options field (conditional) */}
                {['dropdown', 'radio', 'checkbox'].includes(newField.type) && (
                  <div style={{ flex: '1 1 110px', minWidth: '100px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px', opacity: 0.9 }}>Options</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', fontSize: '12px', fontWeight: 500, border: '1.5px solid #d1d5db', borderRadius: '7px', outline: 'none', color: '#111827', backgroundColor: '#fff', fontFamily: 'inherit', transition: 'all 0.15s ease', boxSizing: 'border-box', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)' }}
                      type="text"
                      placeholder="a, b, c"
                      value={newField.options || ''}
                      onChange={e => setNewField(p => ({ ...p, options: e.target.value }))}
                      disabled={modalLoading}
                      onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 2px rgba(132,204,22,0.15), inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                    />
                  </div>
                )}

                {/* Required checkbox + Add button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: '#4b5563', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', paddingBottom: '2px' }}>
                    <input type="checkbox" checked={newField.isRequired}
                      onChange={e => setNewField(p => ({ ...p, isRequired: e.target.checked }))}
                      style={{ accentColor: '#84cc16', cursor: 'pointer', width: '16px', height: '16px' }} />
                    <span>Required</span>
                  </label>
                  <button type="button" onClick={handleAddField} disabled={modalLoading}
                    style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 600, color: '#1a3a00', border: 'none', borderRadius: '7px', cursor: modalLoading ? 'not-allowed' : 'pointer', background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)', boxShadow: '0 2px 4px rgba(101,163,13,0.2)', whiteSpace: 'nowrap', transition: 'all 0.2s ease', opacity: modalLoading ? 0.6 : 1, transform: 'translateY(0)' }}
                    onMouseEnter={e => { if (!modalLoading) { e.currentTarget.style.boxShadow = '0 4px 8px rgba(101,163,13,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 4px rgba(101,163,13,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    + Add Field
                  </button>
                </div>
              </div>

              {/* Field list/chips */}
              {modalFields.formStructure.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '92px', overflowY: 'auto', borderTop: '1px solid rgba(229,231,235,0.5)', paddingTop: '8px' }}>
                  {modalFields.formStructure.map((field, idx) => (
                    <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #f0fce8 0%, #e8fad1 100%)', border: '1px solid #d1faa0', borderRadius: '22px', padding: '4px 10px 4px 10px', fontSize: '12px', fontWeight: 500, color: '#2d5a0e', lineHeight: 1.4, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <span style={{ fontWeight: 600 }}>{field.label}</span>
                      <span style={{ color: '#7ba82e', fontSize: '11px', fontWeight: 400 }}>({field.type})</span>
                      {field.isRequired && <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '13px', lineHeight: 1 }}>*</span>}
                      <button type="button"
                        onClick={() => setModalFields(p => ({ ...p, formStructure: p.formStructure.filter((_, i) => i !== idx) }))}
                        style={{ color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px 0 4px', fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#a3a3a3'}
                      >×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#d1d5db', textAlign: 'center', margin: 0, padding: '6px 0 4px', fontWeight: 500 }}>No fields added yet. Start by filling in the form above.</p>
              )}
            </div>
          </div>

          {/* ═══ Visual Divider ═══ */}
          {!editData && (
            <>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, #e5e7eb, #f3f4f6, #e5e7eb)', margin: '4px 0' }} />

              {/* Info banner */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 12px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '1px solid #fbbbcc', borderRadius: '9px', fontSize: '12px', color: '#be185d', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <svg style={{ flexShrink: 0, marginTop: '2px' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01" />
                </svg>
                <span><strong>Pro tip:</strong> A public landing page URL will be auto-generated. Use it in Google Ads, Meta Ads, or any platform to capture leads directly.</span>
              </div>
            </>
          )}
        </form>
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

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setRowToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Campaign"
        message={<>Are you sure you want to delete <span className="font-semibold text-gray-800">"{rowToDelete?.title}"</span>? This action cannot be undone.</>}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        variant="danger"
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