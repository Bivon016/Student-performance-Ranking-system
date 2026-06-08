import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, School, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE } from '../config';

const Signup = () => {
  const [username,      setUsername]      = useState('');
  const [password,      setPassword]      = useState('');
  const [principalCode, setPrincipalCode] = useState('');
  const [showCodeField, setShowCodeField] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/public/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          // Only send principalCode if the field is shown and filled
          ...(showCodeField && principalCode.trim()
            ? { principalCode: principalCode.trim() }
            : {}),
        }),
      });

      const text = await response.text();

      if (response.ok) {
        setSuccess('Account created! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else if (response.status === 409 || text.includes('taken')) {
        setError('Username already taken. Please choose another.');
      } else {
        setError(text || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-4">
            <School className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Ranking System</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>

          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
            After signing up, link your account to your school to get started.
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Principal code toggle */}
            <div>
              <button
                type="button"
                onClick={() => { setShowCodeField(!showCodeField); setPrincipalCode(''); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <KeyRound size={14} />
                I have a principal access code
                {showCodeField ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showCodeField && (
                <div className="mt-3">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="password"
                      value={principalCode}
                      onChange={e => setPrincipalCode(e.target.value)}
                      placeholder="Enter principal access code"
                      className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    This code is provided by your system administrator.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign In
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;