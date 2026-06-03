import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, KeyRound, Plus, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const BASE = "http://localhost:8080";

const apiFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

export default function SelectSchool() {
      console.log('SelectSchool rendered');  // ✅ add this

  const navigate  = useNavigate();
  const role      = localStorage.getItem('role');
  const isPrincipal = role === 'ROLE_PRINCIPAL';

  const [mode, setMode]       = useState('join'); // 'join' | 'create'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // ── Join mode state ──
  const [schoolCode, setSchoolCode] = useState('');

  // ── Create mode state ──
  const [form, setForm] = useState({
    schoolName:    '',
    schoolCode:    '',
    schoolType:    'SECONDARY',
    city:          '',
    country:       'Kenya',
    postalAddress: '',
    phoneNumber:   '',
    email:         '',
    motto:         '',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // ── Join a school by code ──
  const handleJoin = async () => {
    if (!schoolCode.trim()) { setError('Please enter a school code.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await apiFetch(`${BASE}/auth/users/link-school`, {
        method: 'PUT',
        body: JSON.stringify({ schoolCode: schoolCode.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'School not found. Check the code and try again.');
      }
      const data = await res.json();
      setSuccess(`Joined ${data.schoolName} successfully!`);
      localStorage.removeItem('requiresSchool');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Create a new school (principal only) ──
  const handleCreate = async () => {
    if (!form.schoolName.trim()) { setError('School name is required.'); return; }
    if (!form.schoolCode.trim()) { setError('School code is required.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await apiFetch(`${BASE}/school/register`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create school.');
      }
      const data = await res.json();
      setSuccess(`School "${data.schoolName}" created and linked to your account!`);
      localStorage.removeItem('requiresSchool');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-4">
            <School className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome!</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your account isn't linked to a school yet. Choose an option below to get started.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 mb-6 shadow-sm">
          <button
            onClick={() => { setMode('join'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${mode === 'join' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <KeyRound size={15} /> Join Existing School
          </button>
          {isPrincipal && (
            <button
              onClick={() => { setMode('create'); setError(''); setSuccess(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${mode === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Plus size={15} /> Register New School
            </button>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-5 text-sm">
              <CheckCircle size={16} className="shrink-0" /> {success}
            </div>
          )}

          {/* ── JOIN MODE ── */}
          {mode === 'join' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Enter School Code</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Ask your school principal for the school code and enter it below.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
                <input
                  type="text"
                  value={schoolCode}
                  onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="e.g. GHS001"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {loading ? 'Joining…' : 'Join School'}
              </button>
            </div>
          )}

          {/* ── CREATE MODE ── */}
          {mode === 'create' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Register Your School</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Fill in your school's details. You'll be automatically linked as the principal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                  <input value={form.schoolName} onChange={e => setField('schoolName', e.target.value)}
                    placeholder="e.g. Green Hill Secondary School"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Code *</label>
                  <input value={form.schoolCode} onChange={e => setField('schoolCode', e.target.value.toUpperCase())}
                    placeholder="e.g. GHS001"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
                  <p className="text-xs text-gray-400 mt-1">Share this code with your staff</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Type</label>
                  <select value={form.schoolType} onChange={e => setField('schoolType', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="PRIMARY">Primary</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="JUNIORSEC">Junior Secondary</option>
                    <option value="SENIORSEC">Senior Secondary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={e => setField('city', e.target.value)}
                    placeholder="e.g. Nairobi"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input value={form.country} onChange={e => setField('country', e.target.value)}
                    placeholder="Kenya"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phoneNumber} onChange={e => setField('phoneNumber', e.target.value)}
                    placeholder="+254 700 000 000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setField('email', e.target.value)}
                    placeholder="info@school.ac.ke"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Address</label>
                  <input value={form.postalAddress} onChange={e => setField('postalAddress', e.target.value)}
                    placeholder="P.O. Box 0000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Motto</label>
                  <input value={form.motto} onChange={e => setField('motto', e.target.value)}
                    placeholder="e.g. Excellence Through Knowledge"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {loading ? 'Creating…' : 'Create School & Continue'}
              </button>
            </div>
          )}
        </div>

        {/* Logout link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Wrong account?{' '}
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="text-blue-500 hover:underline"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}