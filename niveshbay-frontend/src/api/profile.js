import api from './axiosInstance';

export async function getProfile() {
  const res = await api.get('/profile');
  return res.data;
}

export async function updateProfile(data) {
  const res = await api.put('/profile', data);
  return res.data;
}
