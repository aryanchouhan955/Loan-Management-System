'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB');
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(f.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('salarySlip', file);
      const { data } = await api.post('/loans/upload-document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocumentId(data.document.id);
      setSuccess(true);
      localStorage.setItem('lms_docId', data.document.id);
      setTimeout(() => router.push('/apply/config'), 800);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Upload Salary Slip</h2>
      <p className="text-gray-500 text-sm mb-6">Upload your latest salary slip. PDF, JPG, or PNG — max 5 MB.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
          ✅ Document uploaded! Redirecting...
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
        {file ? (
          <div>
            <div className="text-3xl mb-2">📄</div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setFile(null); }}
              className="mt-2 text-sm text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="text-3xl mb-2">☁️</div>
            <p className="font-medium text-gray-700">Drop your file here, or click to browse</p>
            <p className="text-sm text-gray-400 mt-1">PDF · JPG · PNG — max 5 MB</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={() => router.push('/apply/personal')}
          className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading || success}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload & Continue →'}
        </button>
      </div>
    </div>
  );
}
