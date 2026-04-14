import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  restoreCampaign,
  searchCampaigns,
  exportLeads,
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
  <svg width="16" height="16" fill="#059669" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 14V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4h-7v3l-5-4 5-4v3h7zM13 4l5 5h-5V4z"></path>
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

/**
 * Normalize parsed rows.
 * - fieldMap: [{ label: 'First Name', key: 'firstname' }, ...] — label is display text, key is the field key sent to backend.
 * - rows: array of objects keyed by normalized key; empty-value fields are omitted.
 */
function normalizeRows(rows) {
  if (rows.length === 0) return { rows: [], fieldMap: [] };
  const rawKeys = Object.keys(rows[0]);
  const fieldMap = rawKeys.map((rawKey) => ({
    label: rawKey.trim(),
    key: rawKey.trim().toLowerCase().replace(/\s+/g, ''),
  }));
  const normalizedRows = rows.map((row) => {
    const out = {};
    rawKeys.forEach((rawKey, i) => {
      const val = String(row[rawKey] ?? '').trim();
      if (val !== '') out[fieldMap[i].key] = val;
    });
    return out;
  });
  return { rows: normalizedRows, fieldMap };
}


function ImportLeadsModal({ isOpen, onClose, campaigns, onImported, preselectedCampaignId }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [externalCampaign, setExternalCampaign] = useState(false);
  const [externalCampaignName, setExternalCampaignName] = useState('');
  const [externalCampaignDescription, setExternalCampaignDescription] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [fieldMap, setFieldMap] = useState([]);
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignSearchResults, setCampaignSearchResults] = useState([]);
  const [campaignSearchLoading, setCampaignSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const fileRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownPortalRef = useRef(null);

  // Auto-select campaign if preselected
  useEffect(() => {
    if (isOpen && preselectedCampaignId) {
      setSelectedCampaign(preselectedCampaignId);
      setStep(2);
    }
  }, [isOpen, preselectedCampaignId]);

  // Debounced campaign search
  useEffect(() => {
    if (!campaignSearch.trim()) {
      setCampaignSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCampaignSearchLoading(true);
      try {
        const results = await searchCampaigns(user._id, campaignSearch);
        setCampaignSearchResults(results);
      } catch (err) {
        console.error('Campaign search failed:', err);
        setCampaignSearchResults([]);
      } finally {
        setCampaignSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [campaignSearch, user._id]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isClickOnInput = searchInputRef.current && searchInputRef.current.contains(e.target);
      const isClickOnDropdown = dropdownPortalRef.current && dropdownPortalRef.current.contains(e.target);

      if (!isClickOnInput && !isClickOnDropdown) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Update dropdown position when opening
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [dropdownOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedCampaign('');
      setExternalCampaign(false);
      setExternalCampaignName('');
      setExternalCampaignDescription('');
      setFile(null);
      setFileUrl('');
      setParsedRows([]);
      setFieldMap([]);
      setParseError('');
      setParsing(false);
      setImporting(false);
      setImportResult(null);
      setCampaignSearch('');
      setCampaignSearchResults([]);
      setDropdownOpen(false);
    }
  }, [isOpen]);

  const handleUrlParse = async () => {
    if (!fileUrl.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const res = await fetch(fileUrl.trim());
      if (!res.ok) throw new Error('Failed to fetch file from URL');
      const urlLower = fileUrl.toLowerCase();
      let rows = [];
      if (urlLower.endsWith('.csv')) {
        const text = await res.text();
        rows = parseCsv(text);
      } else if (externalCampaign) {
        throw new Error('Only .csv files are supported for external campaigns.');
      } else if (urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls')) {
        const blob = await res.blob();
        const f2 = new File([blob], 'import.xlsx');
        rows = await parseExcel(f2);
      } else {
        throw new Error('Only .csv, .xlsx, .xls URLs supported.');
      }
      if (rows.length === 0) throw new Error('No data rows found.');
      const { rows: normalized, fieldMap: fm } = normalizeRows(rows);
      setParsedRows(normalized);
      setFieldMap(fm);
      setStep(3);
    } catch (err) {
      setParseError(err.message || 'Failed to parse URL.');
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    console.log("hello")
    if (!f) return;
    setFile(f);
    setParseError('');
    setParsing(true);
    try {
      let rows = [];
      if (f.name.endsWith('.csv')) {
        const text = await f.text();
        rows = parseCsv(text);
      } else if (externalCampaign) {
        throw new Error('Only .csv files are supported for external campaigns.');
      } else if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
        rows = await parseExcel(f);
      } else if (f.name.endsWith('.pdf')) {
        rows = await parsePdf(f);
      } else {
        throw new Error('Unsupported file format.');
      }
      if (rows.length === 0) throw new Error('No data rows found in file.');
      const { rows: normalized, fieldMap: fm } = normalizeRows(rows);
      setParsedRows(normalized);
      setFieldMap(fm);
      setStep(3);
    } catch (err) {
      setParseError(err.message || 'Failed to parse file.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setParseError('');
    if (parsedRows.length === 0) {
      setParseError('No rows to import.');
      setImporting(false);
      return;
    }
    const toastId = toast.loading(`Importing ${parsedRows.length} leads...`);
    try {
      const result = await importLeadsFromFile({
        campaignId: externalCampaign ? undefined : selectedCampaign,
        campignName: externalCampaign ? externalCampaignName : undefined,
        description: externalCampaign ? externalCampaignDescription : undefined,
        leads: parsedRows,  // flat objects with normalized keys; empty fields already omitted
        company: user._id,
        createdBy: user._id,
      });
      setImportResult(result);
      setStep(4);
      onImported?.();
      if (result.failed > 0) {
        toast.success(`Imported ${result.imported} leads (${result.failed} failed)`, { id: toastId });
      } else {
        toast.success(`Successfully imported ${result.imported} leads!`, { id: toastId });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Import failed.';
      setParseError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const previewHeaders = fieldMap;
  const previewRows = parsedRows.slice(0, 5);
  const selectedCampaignObj = campaigns.find(c => c._id === selectedCampaign);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      {/* Gradient backdrop base */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))',
      }} />
      {/* Grain overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        filter: 'url(#modal-grain)', opacity: 1, mixBlendMode: 'multiply',
      }} />
      {/* Click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      <style>{`
        @keyframes importModalEntrance { 
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes importSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .import-modal-content {
          animation: importModalEntrance 0.36s cubic-bezier(0.34, 1.3, 0.64, 1) both;
        }
        .import-section {
          animation: importSlideUp 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
        .import-section:nth-child(1) { animation-delay: 0.08s; }
        .import-section:nth-child(2) { animation-delay: 0.14s; }
        .import-section:nth-child(3) { animation-delay: 0.20s; }
        .import-section:nth-child(4) { animation-delay: 0.26s; }
      `}</style>

      {/* Modal */}
      <div className="import-modal-content relative bg-white w-full max-w-2xl mx-auto overflow-hidden flex flex-col"
        style={{
          border: '1px solid rgba(200, 200, 200, 0.25)',
          borderTop: '4px solid #84cc16',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          maxHeight: '85vh',
        }}>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-white shrink-0 relative" style={{
          backgroundImage: 'radial-gradient(circle, rgba(132, 204, 22, 0.25) 2.5px, transparent 2.5px)',
          backgroundSize: '12px 2px',
          backgroundPosition: '0 100%',
          backgroundRepeat: 'repeat-x',
          paddingBottom: 'calc(0.75rem + 4px)'
        }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #bbf7d0',
                  cursor: 'default',
                }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#65a30d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">Import Leads</h2>
                {/* <p className="text-xs text-gray-400 mt-0.5">Upload Excel, CSV or PDF with client data</p> */}
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="p-1.5 text-gray-400 hover:text-gray-700 transition-all duration-200 cursor-pointer rounded-full shrink-0"
              style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.1)'; e.currentTarget.style.color = '#4b7c0f'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
            >{XIcon}</button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mt-3">
            {['Campaign', 'Upload', 'Preview', 'Done'].map((label, i) => (
              <React.Fragment key={i}>
                <button
                  type="button"
                  onClick={() => {
                    if (step > i + 1) setStep(i + 1);
                  }}
                  disabled={step <= i + 1}
                  className="flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-opacity hover:disabled:opacity-100"
                  style={{ opacity: step <= i + 1 ? 1 : 0.8 }}
                >
                  <div className={`w-6 h-6 flex items-center justify-center transition-all`}>
                    {step > i + 1 ? (
                      <img src="/image.png" alt="done" style={{ width: '24px', height: '24px', objectFit: 'contain', cursor: 'pointer' }} />
                    ) : (
                      <span className={step === i + 1 ? ' text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center bg-lime-500 text-white' : 'text-gray-400 text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-gray-200'}>{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${step === i + 1 ? 'text-lime-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
                </button>
                {i < 3 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${step > i + 1 ? 'bg-lime-300' : 'bg-gray-100'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Step 1: Select Campaign */}
          {step === 1 && (
            <div className="import-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="text-sm text-gray-600">Which campaign should these leads be linked to?</p>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                <input type="checkbox" checked={externalCampaign} onChange={e => setExternalCampaign(e.target.checked)}
                  style={{ accentColor: '#84cc16', width: '16px', height: '16px' }} />
                Import for external/third-party campaign
              </label>

              {!externalCampaign ? (
                <>
                  {/* Campaign dropdown search */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#84cc16', pointerEvents: 'none' }}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input ref={searchInputRef} type="text" placeholder="Search campaigns..."
                        value={campaignSearch}
                        onChange={e => { setCampaignSearch(e.target.value); setDropdownOpen(true); }}
                        onFocus={() => { setDropdownOpen(true); }}
                        style={{
                          width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px', border: '1.5px solid #e5e7eb',
                          borderRadius: '10px', outline: 'none', background: '#fafbfc', boxSizing: 'border-box',
                          transition: 'all 0.2s ease',
                        }}
                        onKeyDown={e => { if (e.key === 'Escape') setDropdownOpen(false); }}
                      />
                      {campaignSearchLoading && (
                        <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite', color: '#84cc16' }}
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" opacity="0.3" /><path d="M12 2A10 10 0 0 1 22 12" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Dropdown menu portal */}
                  {dropdownOpen && createPortal(
                    <div ref={dropdownPortalRef} style={{
                      position: 'fixed', top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${dropdownPosition.width}px`,
                      background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      maxHeight: '240px', overflowY: 'auto', zIndex: 9999,
                    }}>
                      {campaignSearchLoading ? (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>Searching...</div>
                      ) : campaignSearchResults.length > 0 ? (
                        campaignSearchResults.map((c) => (
                          <button key={c._id} type="button"
                            onClick={() => { setSelectedCampaign(c._id); setDropdownOpen(false); setCampaignSearch(''); setStep(2); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left',
                              padding: '10px 12px', cursor: 'pointer',
                              border: 'none', background: 'white',
                              transition: 'all 0.15s ease',
                              borderBottom: '1px solid #f3f4f6',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                          >
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', color: 'white',
                              fontWeight: 700, fontSize: '13px', flexShrink: 0,
                            }}>
                              {c.title?.[0]?.toUpperCase() || 'C'}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || 'No description'}</p>
                            </div>
                            <span style={{
                              fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', flexShrink: 0, whiteSpace: 'nowrap',
                              ...({
                                1: { background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#166534', border: '1px solid #86efac' },
                                2: { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1e40af', border: '1px solid #93c5fd' },
                                3: { background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', color: '#4b5563', border: '1px solid #d1d5db' },
                                4: { background: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#991b1b', border: '1px solid #fca5a5' },
                              }[c.status] || { background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' }),
                            }}>
                              {STATUS_LABELS[c.status] || 'Unknown'}
                            </span>
                          </button>
                        ))
                      ) : campaignSearch.trim() ? (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>No campaigns found</div>
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>Start typing to search campaigns</div>
                      )}
                    </div>,
                    document.body
                  )}

                  {selectedCampaign && (
                    <button type="button" onClick={() => setStep(2)}
                      style={{
                        padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: 'white', border: 'none',
                        borderRadius: '10px', cursor: 'pointer',
                        background: 'linear-gradient(160deg, #c0eb75 0%, #84cc16 40%, #65a30d 100%)',
                        boxShadow: '0 2px 6px rgba(132,204,22,0.25)', opacity: 1,
                        transition: 'all 0.2s ease', alignSelf: 'flex-end', whiteSpace: 'nowrap',
                      }}>
                      Next: Upload File
                    </button>
                  )}

                  <style>{`
                    @keyframes spin {
                      from { transform: translateY(-50%) rotate(0deg); }
                      to { transform: translateY(-50%) rotate(360deg); }
                    }
                  `}</style>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Input label="External Campaign Name" value={externalCampaignName} onChange={e => setExternalCampaignName(e.target.value)} placeholder="e.g. Google Ads Campaign" />
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '6px', letterSpacing: '0.4px', display: 'block' }}>Description</label>
                    <textarea
                      placeholder="Add a description for this campaign (optional)"
                      value={externalCampaignDescription}
                      onChange={e => setExternalCampaignDescription(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', outline: 'none',
                        fontSize: '13px', color: '#111827', backgroundColor: '#fafbfc', fontFamily: 'inherit', fontWeight: 400,
                        resize: 'vertical', minHeight: '60px', maxHeight: '100px', transition: 'all 0.2s ease',
                        boxSizing: 'border-box', lineHeight: '1.6', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#84cc16';
                        e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.12), inset 0 1px 2px rgba(0,0,0,0.05)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>
                  <button type="button" disabled={!externalCampaignName.trim() || !externalCampaignDescription.trim()} onClick={() => setStep(2)}
                    style={{
                      padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: 'white', border: 'none',
                      borderRadius: '10px', cursor: (externalCampaignName.trim() && externalCampaignDescription.trim()) ? 'pointer' : 'not-allowed',
                      background: 'linear-gradient(160deg, #c0eb75 0%, #84cc16 40%, #65a30d 100%)',
                      boxShadow: '0 2px 6px rgba(132,204,22,0.25)', opacity: (externalCampaignName.trim() && externalCampaignDescription.trim()) ? 1 : 0.5,
                      transition: 'all 0.2s ease', alignSelf: 'flex-end', whiteSpace: 'nowrap',
                    }}>
                    Next: Upload File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 2 && (
            <div className="import-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Selected campaign chip */}
              {selectedCampaignObj && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #84cc16, #65a30d)', color: 'white', fontWeight: 700, fontSize: '11px',
                  }}>{selectedCampaignObj.title?.[0]?.toUpperCase() || 'C'}</div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b7c0f' }}>{selectedCampaignObj.title}</span>
                  <button type="button" onClick={() => { setSelectedCampaign(''); setStep(1); }}
                    style={{ marginLeft: 'auto', fontSize: '11px', color: '#84cc16', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                    Change
                  </button>
                </div>
              )}

              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Upload your client data file. Supported: <strong>{externalCampaign ? '.csv' : '.xlsx, .xls, .csv, .pdf'}</strong>
              </p>

              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Left: File upload dropzone */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    // onClick={() => fileRef.current?.click()}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      width: '100%', height: '140px', border: '2px dashed #bbf7d0', borderRadius: '14px', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #f2fde8 100%)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#84cc16'; e.currentTarget.style.background = 'linear-gradient(135deg, #dcfce7 0%, #d8f5b8 100%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #f2fde8 100%)'; }}
                  >
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', transition: 'transform 0.2s ease',
                    }}>
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                        <path stroke="#65a30d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#65a30d', margin: 0 }}>Click to upload file</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Max 10 MB</p>
                    </div>
                    <input ref={fileRef} type="file" accept={externalCampaign ? '.csv' : ACCEPTED} className="hidden" onChange={handleFileChange} />
                  </label>

                  {/* URL import */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or import from URL {externalCampaign && <span style={{ fontSize: '10px', color: '#9ca3af' }}>(.csv)</span>}</label>
                    <input type="text" placeholder="Paste file URL here"
                      value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                      style={{
                        padding: '9px 12px', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                        outline: 'none', background: '#fafbfc', boxSizing: 'border-box', transition: 'all 0.2s ease',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" disabled={!fileUrl.trim() || parsing} onClick={handleUrlParse}
                      style={{
                        padding: '9px 16px', fontSize: '13px', fontWeight: 600, color: 'white', border: 'none',
                        borderRadius: '10px', cursor: (!fileUrl.trim() || parsing) ? 'not-allowed' : 'pointer',
                        background: 'linear-gradient(160deg, #c0eb75 0%, #84cc16 40%, #65a30d 100%)',
                        boxShadow: '0 2px 6px rgba(132,204,22,0.2)', opacity: (!fileUrl.trim() || parsing) ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                      }}>
                      {parsing ? 'Parsing\u2026' : 'Import from URL'}
                    </button>
                  </div>
                </div>
              </div>

              {parsing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dcfce7', borderTopColor: '#84cc16', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>Parsing file\u2026</p>
                </div>
              )}

              {parseError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                  background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5',
                  borderRadius: '10px', fontSize: '13px', color: '#dc2626',
                }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  {parseError}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="import-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
                    Found <strong>{parsedRows.length}</strong> rows in <span style={{
                      fontFamily: 'monospace', fontSize: '12px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px'
                    }}>{file?.name || 'URL import'}</span>
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                    {previewHeaders.length} field{previewHeaders.length !== 1 ? 's' : ''} detected
                    {previewHeaders.length > 0 && (
                      <span> — {previewHeaders.map(f => (
                        <span key={f.key} title={`field key: ${f.key}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '2px',
                          marginLeft: '4px', fontSize: '10px', background: '#f0fdf4',
                          border: '1px solid #bbf7d0', borderRadius: '4px', padding: '1px 5px', color: '#4b7c0f',
                        }}>{f.label}</span>
                      ))}</span>
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => { setFile(null); setParsedRows([]); setFieldMap([]); setStep(2); }}
                  style={{ fontSize: '12px', color: '#84cc16', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                  Change file
                </button>
              </div>

              <div style={{ overflowX: 'auto', border: '1.5px solid #e5e7eb', borderRadius: '12px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                      {previewHeaders.map((f) => (
                        <th key={f.key} style={{
                          padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#4b7c0f',
                          borderBottom: '1.5px solid #bbf7d0', whiteSpace: 'nowrap', fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          <span>{f.label}</span>
                          <span style={{ display: 'block', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '10px', color: '#86a337', marginTop: '1px' }}>{f.key}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                        {previewHeaders.map((f) => (
                          <td key={f.key} style={{
                            padding: '7px 12px', color: '#374151', maxWidth: '160px', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #f3f4f6',
                          }}>{String(row[f.key] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>Showing 5 of {parsedRows.length} rows</p>
              )}

              {parseError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                  background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5',
                  borderRadius: '10px', fontSize: '13px', color: '#dc2626',
                }}>
                  {parseError}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="import-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: '14px', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', boxShadow: '0 4px 12px rgba(34,197,94,0.15)',
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Import Successful!</p>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  {importResult?.imported ?? parsedRows.length} leads added.
                  {importResult?.failed > 0 && <span style={{ color: '#dc2626' }}> {importResult.failed} rows failed.</span>}
                </p>
              </div>

              {importResult?.failedRows?.length > 0 && (
                <div style={{
                  width: '100%', maxHeight: '120px', overflowY: 'auto', padding: '10px', borderRadius: '10px',
                  background: '#fef2f2', border: '1px solid #fecaca', textAlign: 'left',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>Failed Rows:</p>
                  {importResult.failedRows.map((fr, i) => (
                    <p key={i} style={{ fontSize: '11px', color: '#dc2626', margin: '2px 0' }}>
                      Row {fr.rowIndex}: {fr.error}
                    </p>
                  ))}
                </div>
              )}

              <button onClick={onClose}
                style={{
                  marginTop: '4px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, color: 'white',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  background: 'linear-gradient(160deg, #34d399, #059669)', boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,150,105,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(5,150,105,0.25)'; }}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 3 && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 20px 16px',
          }}>
            <button type="button" onClick={() => setStep(2)}
              style={{
                padding: '9px 18px', fontSize: '13px', fontWeight: 500, color: '#4b5563',
                border: '1.5px solid #d1d5db', borderRadius: '10px', cursor: 'pointer',
                background: 'white', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white'; }}
            >
              Back
            </button>
            <button type="button" onClick={handleImport} disabled={importing}
              style={{
                padding: '9px 22px', fontSize: '13px', fontWeight: 600, color: 'white', border: 'none',
                borderRadius: '10px', cursor: importing ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(160deg, #c0eb75 0%, #84cc16 40%, #65a30d 100%)',
                boxShadow: '0 2px 6px rgba(132,204,22,0.25)', opacity: importing ? 0.7 : 1,
                transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px',
              }}
              onMouseEnter={e => { if (!importing) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(132,204,22,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!importing) { e.currentTarget.style.boxShadow = '0 2px 6px rgba(132,204,22,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {importing && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />}
              {importing ? 'Importing\u2026' : `Import ${parsedRows.length} Leads`}
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
  const [importPreselectedCampaign, setImportPreselectedCampaign] = useState(null);

  // NEW: URL modal
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlCampaign, setUrlCampaign] = useState(null);

  // NEW: success toast for created campaign URL
  const [newCampaignUrl, setNewCampaignUrl] = useState(null);

  // Default Name field that cannot be deleted
  const DEFAULT_NAME_FIELD = {
    name: 'name',
    label: 'Name',
    type: 'text',
    isRequired: true,
    placeholder: 'Enter your Name',
    isDefaultRequired: true, // Flag to prevent deletion
    options: [],
  };

  // Default Phone field that cannot be deleted
  const DEFAULT_PHONE_FIELD = {
    name: 'phone',
    label: 'Phone Number',
    type: 'number',
    isRequired: true,
    placeholder: 'Enter your Phone Number',
    isDefaultRequired: true, // Flag to prevent deletion
    options: [],
  };

  const initialFields = { title: '', description: '', formStructure: [DEFAULT_NAME_FIELD, DEFAULT_PHONE_FIELD], status: 1 };
  const [modalFields, setModalFields] = useState(initialFields);

  const emptyField = { name: '', label: '', type: 'text', isRequired: false, placeholder: '', options: '' };

  // Field type validation helpers
  const validateFieldName = (name) => /^[a-zA-Z0-9_]+$/.test(name);
  const validateFieldLabel = (label) => label.trim().length > 0 && label.trim().length <= 100;
  const validateFieldPlaceholder = (placeholder) => placeholder.trim().length <= 200;
  const validateOptions = (optionsString) => {
    const opts = optionsString.split(',').map(o => o.trim()).filter(Boolean);
    return opts.length > 0 && opts.every(o => o.length > 0);
  };

  const getFieldTypeInput = () => {
    // Returns appropriate input type for HTML5 validation
    switch (newField.type) {
      case 'email': return 'email';
      case 'number': return 'number';
      case 'date': return 'date';
      case 'text':
      case 'textarea':
      case 'dropdown':
      case 'radio':
      case 'checkbox':
      default: return 'text';
    }
  };
  const [newField, setNewField] = useState(emptyField);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [inputSearch, setInputSearch] = useState('');
  const [searchKey, setSearchKey] = useState('title');
  const [status, setStatus] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
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
          page, limit: pageSize, search: searchText, status, showDeleted,
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
  }, [user?._id, page, pageSize, searchText, status, showDeleted, refreshTick]);

  const handleAddField = () => {
    // Validation checks
    if (!newField.name.trim()) {
      toast.error('Field Key is required');
      return;
    }
    if (!validateFieldName(newField.name)) {
      toast.error('Field Key must only contain letters, numbers, and underscores');
      return;
    }
    if (!newField.label.trim()) {
      toast.error('Label is required');
      return;
    }
    if (!validateFieldLabel(newField.label)) {
      toast.error('Label must be between 1-100 characters');
      return;
    }
    if (!validateFieldPlaceholder(newField.placeholder)) {
      toast.error('Placeholder must be less than 200 characters');
      return;
    }
    if (['dropdown', 'radio', 'checkbox'].includes(newField.type)) {
      if (!newField.options.trim()) {
        toast.error(`Options are required for ${newField.type} fields`);
        return;
      }
      if (!validateOptions(newField.options)) {
        toast.error('Each option must be non-empty (comma-separated)');
        return;
      }
    }

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
    toast.success(`Field "${field.label}" added successfully`);
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
    {
      key: 'title',
      label: 'Title',
      searchable: true,
      render: (v, row) => (
        <span style={{
          textDecoration: row.deleted ? 'line-through' : 'none',
          color: row.deleted ? '#9ca3af' : '#374151',
          opacity: row.deleted ? 0.7 : 1,
        }}>
          {v}
          {row.deleted && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>(deleted)</span>}
        </span>
      ),
    },
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
    const toastId = toast.loading(`Exporting ${campaign.title} leads...`);
    try {
      const leads = await exportLeads(campaign._id);

      if (!leads || leads.length === 0) {
        toast.error('No leads found to export', { id: toastId });
        return;
      }

      // Flatten each lead: spread leadData fields + simple scalar fields only
      const flatLeads = leads.map((lead) => {
        const row = {};
        // Dynamic form fields from leadData
        if (lead.leadData && typeof lead.leadData === 'object') {
          Object.entries(lead.leadData).forEach(([k, v]) => {
            row[k] = v ?? '';
          });
        }
        row['Status'] = lead.status ?? '';
        row['Next Meeting'] = lead.nextMeetingDate
          ? new Date(lead.nextMeetingDate).toLocaleDateString()
          : '';
        row['Assigned To'] = lead.assignedTo?.name ?? '';
        row['Created At'] = lead.createdAt
          ? new Date(lead.createdAt).toLocaleDateString()
          : '';
        return row;
      });

      const headers = Object.keys(flatLeads[0]);
      const csv = [headers.join(',')].concat(
        flatLeads.map(row =>
          headers.map(h => '"' + String(row[h] ?? '').replace(/"/g, '""') + '"').join(',')
        )
      ).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign.title || 'leads'}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);

      toast.success(`Exported ${leads.length} leads!`, { id: toastId });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Export failed';
      toast.error(errorMsg, { id: toastId });
      console.error('Export error:', error);
    }
  };

  const actions = [
    {
      key: 'edit', label: 'Edit', icon: EditIcon,
      onClick: row => {
        hapticTap();
        setEditData(row);
        // Ensure the default Name and Phone fields exist and mark them
        let formStructure = (row.formStructure || []).map(field => {
          // Mark Name and Phone fields as default (required)
          if (field.name === 'name' || field.name === 'phone') {
            return { ...field, isDefaultRequired: true };
          }
          return field;
        });

        const hasNameField = formStructure.some(f => f.name === 'name');
        const hasPhoneField = formStructure.some(f => f.name === 'phone');

        if (!hasNameField) {
          formStructure = [DEFAULT_NAME_FIELD, ...formStructure];
        }
        if (!hasPhoneField) {
          formStructure = [...formStructure, DEFAULT_PHONE_FIELD];
        }

        setModalFields({
          title: row.title || '',
          description: row.description || '',
          formStructure,
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
        setImportPreselectedCampaign(row._id);
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
      key: 'delete', label: showDeleted ? 'Restore' : 'Delete',
      icon: showDeleted ? (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4M3 10l1 12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-12m-2-2v-2a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v2" /></svg>
      ) : TrashIcon,
      variant: showDeleted ? 'success' : 'danger',
      onClick: row => {
        hapticTap();
        if (showDeleted) {
          // Restore action
          setRowToDelete(row); // Reuse setRowToDelete for the row
          setDeleteConfirmOpen(true); // Reuse delete confirm for restore
        } else {
          // Delete action
          setRowToDelete(row);
          setDeleteConfirmOpen(true);
        }
      },
    },
  ];

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    setDeleteLoading(true);
    try {
      if (showDeleted) {
        // Restore action
        await restoreCampaign(rowToDelete._id);
        toast.success('Campaign restored successfully!');
      } else {
        // Delete action
        await deleteCampaign(rowToDelete._id);
        toast.success('Campaign deleted successfully!');
      }
      setDeleteConfirmOpen(false);
      setRowToDelete(null);
      loadCampaigns();
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed to ${showDeleted ? 'restore' : 'delete'} campaign`);
      console.error('Delete/restore campaign error', e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async (row) => {
    hapticTap();
    try {
      await restoreCampaign(row._id);
      toast.success('Campaign restored successfully!');
      loadCampaigns();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to restore campaign');
      console.error('Restore campaign error', e);
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
            Import Campaign
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

          {/* Show deleted checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '11px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: '500',
            color: showDeleted ? '#991b1b' : '#6b7280',
            background: showDeleted ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            border: showDeleted ? '1px solid #fca5a5' : '1px solid #d1d5db',
            transition: 'all 0.2s ease',
          }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setPage(1);
              }}
              style={{
                accentColor: '#991b1b',
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            Show Deleted
          </label>
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
                  { key: 'Name', label: 'Field Key', placeholder: 'e.g. phone_number', flex: '1 1 100px', minWidth: '90px' },
                  { key: 'Label', label: 'Label', placeholder: 'e.g. Phone Number', flex: '1 1 100px', minWidth: '90px' },
                  { key: 'Type', label: 'Type', placeholder: 'text', isSelect: true, flex: '0 0 95px' },
                  { key: 'Placeholder', label: 'Placeholder', placeholder: 'optional', flex: '1 1 90px', minWidth: '80px' },
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
                        type="Text"
                        placeholder={placeholder}
                        autoComplete={key === 'name' ? 'off' : 'off'}
                        value={newField[key] || ''}
                        onChange={e => {
                          const value = e.target.value;
                          if (key === 'name') {
                            // Validate field name format (alphanumeric + underscore only)
                            if (value && !/^[a-zA-Z0-9_]*$/.test(value)) {
                              return; // Silently reject invalid characters
                            }
                            // Auto-fill label and placeholder based on field name
                            const formattedLabel = value
                              .split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ');
                            const formattedPlaceholder = `Please Enter Your ${formattedLabel}`;
                            setNewField(p => ({
                              ...p,
                              name: value,
                              label: formattedLabel,
                              placeholder: formattedPlaceholder
                            }));
                          } else {
                            setNewField(p => ({ ...p, [key]: value }));
                          }
                        }}
                        disabled={modalLoading}
                        onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 2px rgba(132,204,22,0.15), inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.03)'; }}
                      />
                    )}
                  </div>
                ))}

                {/* Options field (conditional) */}
                {['Dropdown', 'Radio', 'Checkbox'].includes(newField.type) && (
                  <div style={{ flex: '1 1 110px', minWidth: '100px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px', opacity: 0.9 }}>Options</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', fontSize: '12px', fontWeight: 500, border: '1.5px solid #d1d5db', borderRadius: '7px', outline: 'none', color: '#111827', backgroundColor: '#fff', fontFamily: 'inherit', transition: 'all 0.15s ease', boxSizing: 'border-box', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)' }}
                      type="Text"
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
                    <input type="Checkbox" checked={newField.isRequired}
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
                    <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: field.isDefaultRequired ? 'linear-gradient(135deg, #fef3f2 0%, #fee4e2 100%)' : 'linear-gradient(135deg, #f0fce8 0%, #e8fad1 100%)', border: field.isDefaultRequired ? '1px solid #face8d' : '1px solid #d1faa0', borderRadius: '22px', padding: '4px 10px 4px 10px', fontSize: '12px', fontWeight: 500, color: field.isDefaultRequired ? '#7c2d12' : '#2d5a0e', lineHeight: 1.4, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <span style={{ fontWeight: 600 }}>{field.label}</span>
                      <span style={{ color: field.isDefaultRequired ? '#c2410c' : '#7ba82e', fontSize: '11px', fontWeight: 400 }}>({field.type})</span>
                      {field.isRequired && <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '13px', lineHeight: 1 }}>*</span>}
                      {field.isDefaultRequired && <span style={{ color: '#92400e', fontSize: '10px', fontWeight: 600, marginLeft: '2px' }}>DEFAULT</span>}
                      {!field.isDefaultRequired && (
                        <button type="button"
                          onClick={() => setModalFields(p => ({ ...p, formStructure: p.formStructure.filter((_, i) => i !== idx) }))}
                          style={{ color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px 0 4px', fontSize: '14px', lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#a3a3a3'}
                        >{TrashIcon}</button>
                      )}
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

      {/* Delete/Restore confirm dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setRowToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title={showDeleted ? "Restore Campaign" : "Delete Campaign"}
        message={showDeleted ? (
          <>Are you sure you want to restore <span className="font-semibold text-gray-800">"{rowToDelete?.title}"</span>?</>
        ) : (
          <>Are you sure you want to delete <span className="font-semibold text-gray-800">"{rowToDelete?.title}"</span>? This action cannot be undone.</>
        )}
        confirmLabel={deleteLoading ? (showDeleted ? 'Restoring…' : 'Deleting…') : (showDeleted ? 'Restore' : 'Delete')}
        variant={showDeleted ? "success" : "danger"}
      />

      {/* ── Import Leads Modal ── */}
      <ImportLeadsModal
        isOpen={importModalOpen}
        onClose={() => { setImportModalOpen(false); setImportPreselectedCampaign(null); }}
        campaigns={values}
        onImported={loadCampaigns}
        preselectedCampaignId={importPreselectedCampaign}
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