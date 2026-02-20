export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token'); // get the JWT token
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // add token if exists
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response; // <-- RETURN the response
};
