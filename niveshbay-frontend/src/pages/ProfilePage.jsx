import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../api/profile';

const LABEL_MAP = {
  first_name: 'First Name',
  last_name: 'Last Name',
  username: 'Username',
  language: 'Language',
  country: 'Country',
  city: 'City',
  address: 'Address',
  bio: 'Bio',
  image: 'Profile Image URL',
};

const PROFILE_FIELDS = [
  'first_name', 'last_name', 'username', 'language',
  'country', 'city', 'address', 'bio', 'image',
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getProfile();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#f0b90b] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg p-8 text-center">
          <p className="text-[#f6465d] text-sm font-semibold">{error}</p>
          <button
            onClick={() => navigate('/trade/SOL-INR')}
            className="mt-4 text-xs text-[#f0b90b] hover:underline cursor-pointer"
          >
            Back to Trading
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate('/trade/SOL-INR')}
          className="flex items-center gap-2 text-[#848e9c] hover:text-white text-xs font-semibold mb-4 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <div className="bg-[#141822] border border-[#1e2433] rounded-lg p-6 md:p-8">
          <h1 className="text-xl font-bold mb-6 text-[#f0b90b]">My Profile</h1>

          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-[#1e2433]">
              <div className="w-14 h-14 rounded-full bg-[#0ecb81] flex items-center justify-center text-xl font-bold text-black">
                {(profile.first_name?.[0] || profile.email?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{profile.first_name || ''} {profile.last_name || ''}</p>
                <p className="text-[#848e9c] text-xs">{profile.user_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#1e2433]">
              <div>
                <label className="block text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Email</label>
                <p className="text-white text-sm font-medium">{profile.email}</p>
              </div>
              <div>
                <label className="block text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Phone</label>
                <p className="text-white text-sm font-medium">{profile.phone || '-'}</p>
              </div>
            </div>

            <div className="space-y-4">
              {PROFILE_FIELDS.map(field => (
                <div key={field}>
                  <label className="block text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">
                    {LABEL_MAP[field] || field}
                  </label>
                  {field === 'bio' ? (
                    <textarea
                      readOnly
                      value={profile[field] || ''}
                      className="w-full bg-[#1e2433] border border-[#2b3548] rounded px-3 py-2 text-sm text-white placeholder-[#848e9c] focus:outline-none resize-none cursor-not-allowed opacity-70"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field === 'image' ? 'url' : 'text'}
                      readOnly
                      value={profile[field] || ''}
                      className="w-full bg-[#1e2433] border border-[#2b3548] rounded px-3 py-2 text-sm text-white placeholder-[#848e9c] focus:outline-none cursor-not-allowed opacity-70"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('/balance')}
              className="flex-1 bg-[#1e2330] hover:bg-[#0ecb81]/15 border border-[#0ecb81] text-[#0ecb81] font-bold py-3 rounded-lg text-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              Show Balance
            </button>
            <button
              onClick={() => navigate('/me/update')}
              className="flex-1 bg-[#f0b90b] hover:bg-[#f0c92b] text-black font-bold py-3 rounded-lg text-sm transition cursor-pointer shadow-lg"
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
