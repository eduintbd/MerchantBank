import { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Upload, X, FileText, FileSpreadsheet, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ParsedHolding {
  stock_symbol: string;
  quantity: number;
  avg_buy_price: number;
}

type BrokerFormat = 'ucb' | 'idlc' | 'brac' | 'lankabd' | 'custom';

const brokerFormats: { id: BrokerFormat; name: string; desc: string }[] = [
  { id: 'ucb', name: 'UCB Stock Brokerage', desc: 'UCB Capital Management' },
  { id: 'idlc', name: 'IDLC Securities', desc: 'IDLC Investments Ltd' },
  { id: 'brac', name: 'BRAC EPL', desc: 'BRAC EPL Stock Brokerage' },
  { id: 'lankabd', name: 'LankaBangla', desc: 'LankaBangla Securities' },
  { id: 'custom', name: 'Custom / Generic', desc: 'Any CSV or PDF with portfolio data' },
];

// ── CSV Parsing ──

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { row.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    row.push(current.trim());
    return row;
  });
}

function detectSymbolCol(headers: string[]): number {
  const patterns = [/^symbol$/i, /^scrip$/i, /^stock.?code$/i, /^ticker$/i, /^stock$/i, /^company.?code$/i, /^instrument$/i];
  for (const p of patterns) {
    const idx = headers.findIndex(h => p.test(h));
    if (idx !== -1) return idx;
  }
  return 0;
}

function detectQtyCol(headers: string[]): number {
  const patterns = [/^qty$/i, /^quantity$/i, /^shares$/i, /^total.?qty$/i, /^units$/i, /^holding$/i, /^balance$/i];
  for (const p of patterns) {
    const idx = headers.findIndex(h => p.test(h));
    if (idx !== -1) return idx;
  }
  return 1;
}

function detectPriceCol(headers: string[]): number {
  const patterns = [/avg.?(?:buy|cost|rate|price)/i, /cost.?price/i, /avg.?rate/i, /average.?price/i, /^avg$/i, /buy.?price/i, /purchase.?price/i, /unit.?cost/i];
  for (const p of patterns) {
    const idx = headers.findIndex(h => p.test(h));
    if (idx !== -1) return idx;
  }
  return 2;
}

function parseNum(val: string): number {
  return parseFloat(val.replace(/[^0-9.\-]/g, '')) || 0;
}

function parseBrokerCSV(rows: string[][], format: BrokerFormat): ParsedHolding[] {
  if (rows.length < 2) return [];
  const headers = rows[0];
  const dataRows = rows.slice(1).filter(r => r.length >= 3 && r.some(c => c.length > 0));

  let symIdx: number, qtyIdx: number, priceIdx: number;

  switch (format) {
    case 'ucb':
      symIdx = headers.findIndex(h => /symbol/i.test(h));
      qtyIdx = headers.findIndex(h => /qty|quantity/i.test(h));
      priceIdx = headers.findIndex(h => /avg.?cost|avg.?price|cost/i.test(h));
      break;
    case 'idlc':
      symIdx = headers.findIndex(h => /scrip|symbol/i.test(h));
      qtyIdx = headers.findIndex(h => /quantity|qty/i.test(h));
      priceIdx = headers.findIndex(h => /avg.?rate|avg.?price/i.test(h));
      break;
    case 'brac':
      symIdx = headers.findIndex(h => /stock.?code|symbol/i.test(h));
      qtyIdx = headers.findIndex(h => /shares|quantity|qty/i.test(h));
      priceIdx = headers.findIndex(h => /cost.?price|avg/i.test(h));
      break;
    case 'lankabd':
      symIdx = headers.findIndex(h => /symbol/i.test(h));
      qtyIdx = headers.findIndex(h => /quantity|qty/i.test(h));
      priceIdx = headers.findIndex(h => /avg.?price|avg/i.test(h));
      break;
    default:
      symIdx = detectSymbolCol(headers);
      qtyIdx = detectQtyCol(headers);
      priceIdx = detectPriceCol(headers);
  }

  if (symIdx === -1) symIdx = detectSymbolCol(headers);
  if (qtyIdx === -1) qtyIdx = detectQtyCol(headers);
  if (priceIdx === -1) priceIdx = detectPriceCol(headers);

  const holdings: ParsedHolding[] = [];
  for (const row of dataRows) {
    const symbol = (row[symIdx] || '').toUpperCase().trim();
    const qty = parseNum(row[qtyIdx] || '');
    const price = parseNum(row[priceIdx] || '');
    if (symbol && qty > 0 && price > 0) {
      holdings.push({ stock_symbol: symbol, quantity: qty, avg_buy_price: price });
    }
  }
  return holdings;
}

// ── PDF Parsing ──

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Group text items by their Y position to reconstruct rows
    const lineMap = new Map<number, { x: number; text: string }[]>();
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = Math.round((item as any).transform[5]); // Y coordinate
      const x = (item as any).transform[4]; // X coordinate
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, text: (item as any).str });
    }
    // Sort by Y descending (PDF coordinates are bottom-up), then X ascending
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineText = items.map(i => i.text).join('\t');
      if (lineText.trim()) pages.push(lineText);
    }
  }
  return pages.join('\n');
}

// DSE stock symbols are typically 2-10 uppercase letters
const DSE_SYMBOL_PATTERN = /^[A-Z][A-Z0-9]{1,14}$/;

function parsePDFText(text: string): ParsedHolding[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const holdings: ParsedHolding[] = [];

  // Strategy 1: Try to detect as tab/space-separated table
  // Look for lines that have a stock-like symbol followed by numbers
  for (const line of lines) {
    // Split by tabs or multiple spaces
    const parts = line.split(/\t+|\s{2,}/).map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) continue;

    // Try to find a symbol-like token and numbers in this line
    let symbol = '';
    const numbers: number[] = [];

    for (const part of parts) {
      const cleaned = part.replace(/[,৳$BDT\s]/g, '');
      if (!symbol && DSE_SYMBOL_PATTERN.test(part.trim())) {
        symbol = part.trim();
      } else if (/^[0-9]+\.?[0-9]*$/.test(cleaned) && cleaned.length > 0) {
        numbers.push(parseFloat(cleaned));
      }
    }

    if (symbol && numbers.length >= 2) {
      // Heuristic: first number is likely quantity (integer-ish), second is price
      // Find the integer-like number for quantity and a decimal for price
      let qty = 0;
      let price = 0;

      // If there are exactly 2 numbers, first = qty, second = price
      if (numbers.length === 2) {
        qty = numbers[0];
        price = numbers[1];
      } else {
        // Multiple numbers: find the most likely qty (whole number) and price
        // Typically: qty, avg_price, market_price, total_value, etc.
        for (const n of numbers) {
          if (!qty && n > 0 && n === Math.floor(n) && n < 1000000) {
            qty = n;
          } else if (qty && !price && n > 0 && n < 100000) {
            price = n;
          }
        }
        // Fallback
        if (!qty && numbers[0] > 0) qty = numbers[0];
        if (!price && numbers.length > 1 && numbers[1] > 0) price = numbers[1];
      }

      if (qty > 0 && price > 0) {
        // Avoid duplicates
        const existing = holdings.find(h => h.stock_symbol === symbol);
        if (!existing) {
          holdings.push({ stock_symbol: symbol, quantity: qty, avg_buy_price: price });
        }
      }
    }
  }

  return holdings;
}

// ── Template Download ──

function downloadTemplate(format: BrokerFormat) {
  let csv = '';
  switch (format) {
    case 'ucb':
      csv = 'Symbol,Name,Qty,Avg Cost,Market Price\nGP,Grameenphone Ltd,100,420.50,445.00\nBRAC,BRAC Bank Ltd,200,38.50,42.30';
      break;
    case 'idlc':
      csv = 'Scrip,Quantity,Avg. Rate,Current Rate\nGP,100,420.50,445.00\nBRAC,200,38.50,42.30';
      break;
    case 'brac':
      csv = 'Stock Code,Company,Shares,Cost Price,Market Price\nGP,Grameenphone Ltd,100,420.50,445.00\nBRAC,BRAC Bank Ltd,200,38.50,42.30';
      break;
    case 'lankabd':
      csv = 'Symbol,Quantity,Avg Price,Market Value\nGP,100,420.50,44500.00\nBRAC,200,38.50,8460.00';
      break;
    default:
      csv = 'symbol,quantity,avg_buy_price\nGP,100,420.50\nBRAC,200,38.50';
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio_template_${format}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Modal Component ──

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PortfolioUploadModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [broker, setBroker] = useState<BrokerFormat>('custom');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedHolding[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select');

  function reset() {
    setFile(null);
    setParsed([]);
    setError('');
    setParsing(false);
    setStep('select');
  }

  async function handleFile(f: File) {
    setError('');
    setFile(f);
    const isPdf = f.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setParsing(true);
      try {
        const text = await extractTextFromPDF(f);
        if (!text.trim()) {
          setError('Could not extract any text from the PDF. The file may be image-based (scanned). Please try exporting as CSV from your broker instead.');
          setParsing(false);
          return;
        }
        const holdings = parsePDFText(text);
        if (holdings.length === 0) {
          setError('Could not detect any stock holdings in the PDF. Make sure it contains a portfolio table with stock symbols, quantities, and prices. You can also try uploading as CSV.');
          setParsing(false);
          return;
        }
        setParsed(holdings);
        setStep('preview');
      } catch {
        setError('Failed to parse the PDF file. Please try exporting your portfolio as CSV instead.');
      } finally {
        setParsing(false);
      }
      return;
    }

    // CSV handling
    try {
      const text = await f.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setError('CSV file is empty or has no data rows.');
        return;
      }
      const holdings = parseBrokerCSV(rows, broker);
      if (holdings.length === 0) {
        setError('Could not parse any valid holdings. Make sure the CSV has columns for symbol, quantity, and average price. Try downloading the template for reference.');
        return;
      }
      setParsed(holdings);
      setStep('preview');
    } catch {
      setError('Failed to read the file. Please make sure it is a valid CSV file.');
    }
  }

  async function handleUpload() {
    if (!user || parsed.length === 0) return;
    setUploading(true);
    try {
      for (const h of parsed) {
        const totalInvested = h.quantity * h.avg_buy_price;
        const { error: err } = await supabase.from('portfolio').upsert(
          {
            user_id: user.id,
            stock_symbol: h.stock_symbol,
            quantity: h.quantity,
            avg_buy_price: h.avg_buy_price,
            total_invested: totalInvested,
          },
          { onConflict: 'user_id,stock_symbol' }
        );
        if (err) throw err;
      }
      toast.success(`Successfully imported ${parsed.length} holdings`);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-5 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-lg">Import Portfolio</h2>
            <p className="text-xs text-muted mt-0.5">Upload CSV or PDF from your broker</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {step === 'select' && (
            <div className="space-y-5">
              {/* Broker Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Select Broker Format</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {brokerFormats.map(b => (
                    <button
                      key={b.id}
                      onClick={() => { setBroker(b.id); setError(''); }}
                      className={cn(
                        'text-left p-3 rounded-xl border-2 transition-all',
                        broker === b.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <p className="text-sm font-semibold">{b.name}</p>
                      <p className="text-xs text-muted mt-0.5">{b.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Template */}
              <button
                onClick={() => downloadTemplate(broker)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-info hover:text-info/80 transition-colors"
              >
                <Download size={14} /> Download CSV Template
              </button>

              {/* File Upload Zone */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                  'hover:border-primary/40 hover:bg-primary/5',
                  file ? 'border-success/40 bg-success/5' : 'border-border'
                )}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-info animate-spin" />
                    <p className="text-sm font-medium">Parsing PDF...</p>
                    <p className="text-xs text-muted">Extracting portfolio data from your document</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center gap-2">
                    {file.name.toLowerCase().endsWith('.pdf') ? (
                      <FileText size={32} className="text-danger" />
                    ) : (
                      <FileSpreadsheet size={32} className="text-success" />
                    )}
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={32} className="text-muted" />
                    <p className="text-sm font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted">Supported: CSV and PDF files</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2.5 py-1 rounded-full font-medium">
                        <FileSpreadsheet size={12} /> CSV
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-danger bg-danger/10 px-2.5 py-1 rounded-full font-medium">
                        <FileText size={12} /> PDF
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                  <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              {/* Instructions */}
              <Card className="!bg-gray-50 !border-gray-200">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-info" /> How to export from your broker
                </h4>
                <ol className="text-xs text-muted space-y-1.5 list-decimal list-inside">
                  <li>Log in to your broker's web platform or app</li>
                  <li>Navigate to Portfolio or Holdings section</li>
                  <li>Look for "Export", "Download", or "Print" option</li>
                  <li>Export as <strong>CSV</strong> (recommended) or download the <strong>PDF</strong> statement</li>
                  <li>Upload the file here — both CSV and PDF are supported</li>
                </ol>
                <div className="mt-3 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning font-medium">
                    Tip: CSV files give the most accurate results. PDF works best with text-based documents — scanned/image PDFs may not parse correctly.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/20">
                <CheckCircle size={16} className="text-success shrink-0" />
                <p className="text-sm text-success font-medium">
                  Found {parsed.length} holdings from {file?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'CSV'}
                </p>
              </div>

              {file?.name.toLowerCase().endsWith('.pdf') && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-info/5 border border-info/20">
                  <AlertCircle size={16} className="text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-info">
                    PDF parsing uses text extraction. Please review the parsed data carefully before importing. If values look incorrect, consider uploading a CSV instead.
                  </p>
                </div>
              )}

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-border bg-gray-50">
                      <th className="px-4 py-2.5 font-medium">#</th>
                      <th className="px-4 py-2.5 font-medium">Symbol</th>
                      <th className="px-4 py-2.5 font-medium text-right">Quantity</th>
                      <th className="px-4 py-2.5 font-medium text-right">Avg Buy Price</th>
                      <th className="px-4 py-2.5 font-medium text-right">Total Invested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((h, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 text-muted">{i + 1}</td>
                        <td className="px-4 py-2.5 font-semibold">{h.stock_symbol}</td>
                        <td className="px-4 py-2.5 text-right font-num">{h.quantity.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-num">৳{h.avg_buy_price.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-num">৳{(h.quantity * h.avg_buy_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-sm">
                      <td colSpan={2} className="px-4 py-2.5">Total</td>
                      <td className="px-4 py-2.5 text-right font-num">{parsed.reduce((s, h) => s + h.quantity, 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">—</td>
                      <td className="px-4 py-2.5 text-right font-num">৳{parsed.reduce((s, h) => s + h.quantity * h.avg_buy_price, 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                  <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <p className="text-xs text-muted">
                This will update your portfolio. Existing holdings for the same stock symbol will be replaced with the uploaded values.
              </p>

              <div className="flex items-center gap-3 justify-end">
                <Button variant="secondary" onClick={reset}>Back</Button>
                <Button onClick={handleUpload} loading={uploading} icon={<Upload size={16} />}>
                  Import {parsed.length} Holdings
                </Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-success mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-1">Portfolio Imported!</h3>
              <p className="text-sm text-muted mb-6">
                {parsed.length} holdings have been added to your portfolio.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="secondary" onClick={() => { reset(); }}>Upload Another</Button>
                <Button onClick={() => { onClose(); window.location.reload(); }}>View Portfolio</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
