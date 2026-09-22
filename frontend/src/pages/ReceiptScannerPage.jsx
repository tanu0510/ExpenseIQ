import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { receiptService } from '../services/receiptService';
import { transactionService } from '../services/transactionService';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/constants';
import {
  ScanLine,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  Building,
  Tag,
  ArrowRight,
  Loader2,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';

const ReceiptScannerPage = () => {
  const { formatCurrency } = useCurrency();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(1);
  const [ocrResult, setOcrResult] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable form after OCR extraction
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    paymentMethod: 'UPI',
    notes: '',
    tags: 'receipt, ocr'
  });

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(selectedFile.type)) {
      error('Please select an image file (JPEG, PNG, or WebP)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      error('Image size must be less than 10 MB');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setOcrResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleScan = async () => {
    if (!file) {
      error('Please select an image first');
      return;
    }

    try {
      setScanning(true);
      setScanStep(1);

      // Visual progress simulator for OCR stages
      const t1 = setTimeout(() => setScanStep(2), 1200);
      const t2 = setTimeout(() => setScanStep(3), 2800);

      const res = await receiptService.analyzeReceipt(file);

      clearTimeout(t1);
      clearTimeout(t2);

      const data = res.data;
      setOcrResult(data);

      setFormData({
        description: data.merchant ? `${data.merchant} Receipt` : 'Receipt Expense',
        amount: data.amount ? String(data.amount) : '',
        date: data.date || new Date().toISOString().split('T')[0],
        category: data.category && EXPENSE_CATEGORIES.includes(data.category) ? data.category : 'Food',
        paymentMethod: 'UPI',
        notes: data.items && data.items.length > 0 ? `Items: ${data.items.slice(0, 4).join(', ')}` : '',
        tags: 'receipt, ocr',
        receiptUrl: data.receiptUrl
      });

      success('Receipt scanned! Please review and verify the extracted details below.');
    } catch (err) {
      error(err.response?.data?.error || 'Failed to scan receipt. You can manually enter the transaction.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      error('Please verify or enter a positive amount');
      return;
    }
    if (!formData.description) {
      error('Please enter a description');
      return;
    }

    try {
      setSaving(true);
      await transactionService.createTransaction({
        type: 'expense',
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        notes: formData.notes,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        receiptUrl: formData.receiptUrl || ''
      });

      success('Transaction created and linked to receipt!');
      navigate('/transactions');
    } catch (err) {
      error(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Receipt OCR Scanner</h1>
            <p className="text-sm text-slate-500">
              Upload paper receipts or invoices to automatically extract merchants, dates, and amounts using EasyOCR.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              previewUrl
                ? 'border-emerald-500/50 bg-emerald-50/20'
                : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files[0])}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative max-h-72 rounded-xl overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center">
                  <img src={previewUrl} alt="Receipt preview" className="max-h-72 object-contain" />
                </div>
                <p className="text-xs font-semibold text-slate-700">{file?.name}</p>
                <p className="text-[11px] text-slate-400">Click or drag a new image to replace</p>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP (max 10 MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Scan Action Button */}
          {file && !ocrResult && (
            <button
              type="button"
              disabled={scanning}
              onClick={handleScan}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {scanStep === 1
                      ? 'Uploading receipt image...'
                      : scanStep === 2
                      ? 'Running EasyOCR text detection...'
                      : 'Parsing amounts & merchant entities...'}
                  </span>
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  <span>Extract Receipt Information</span>
                </>
              )}
            </button>
          )}

          {/* Academic Transparency Note */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>How EasyOCR Works Here:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              The receipt image is processed by Python EasyOCR deep learning text detector, then parsed via regex for total currency sums, dates, and merchant names. You can inspect and edit every field prior to saving.
            </p>
          </div>
        </div>

        {/* Verification & Edit Form Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Extracted Transaction Review</h2>
                <p className="text-xs text-slate-400">
                  {ocrResult ? 'Verify or adjust values before committing to your records.' : 'Upload and scan an image to auto-fill this form.'}
                </p>
              </div>

              {ocrResult && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>OCR Processed</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Description / Merchant */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description / Merchant *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. Reliance Fresh"
                      className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Amount *</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full pl-9 pr-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Extracted Items</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Items or notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Raw text disclosure toggle */}
              {ocrResult && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showRawText ? 'Hide Raw OCR Text' : 'Show Extracted Raw OCR Text'}</span>
                  </button>
                  {showRawText && (
                    <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border border-slate-800">
                      {ocrResult.rawText || 'No text extracted'}
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setOcrResult(null);
                    setFormData({
                      description: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      category: 'Food',
                      paymentMethod: 'UPI',
                      notes: '',
                      tags: 'receipt, ocr'
                    });
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={saving || (!ocrResult && !formData.amount)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save as Transaction</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScannerPage;
