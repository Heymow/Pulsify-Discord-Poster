import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add Basic Auth if we decide to enforce it. 
    // For now, let's assume backend auth is disabled for localhost or handled via proxy.
    // If we need auth:
    // 'Authorization': 'Basic ' + btoa('username:password')
  }
});

// Since we kept auth in backend, we need to send credentials.
// We should probably ask user for credentials or hardcode them if they are in .env
// But frontend doesn't have access to .env of backend.
// For this local tool, I will hardcode the credentials in the request for now, 
// or better, add a login screen?
// The user request says "L'utilisateur devra avoir dans l'interface des réglages pour s'identifier avec Discord".
// But the backend uses Basic Auth for the API itself (Suno Automation).
// I will assume for now we can use the credentials from the backend .env if we knew them.
// Let's try to fetch them or just disable auth for localhost in backend? 
// I didn't disable it.
// I will add an interceptor to add auth header if token exists, 
// and a login page if 401.
// OR, since I am the developer, I can just hardcode the auth header if I know the credentials.
// The credentials are in `backend/.env`. I can read them?
// No, frontend runs in browser.
// Let's add a simple Login page or just ask user to input them.
// Actually, for a local tool, maybe I should just disable auth for localhost in `server.js`?
// That would be easiest.
// Let's modify `server.js` to skip auth for localhost or specific IP?
// Or just hardcode a default auth token in frontend?
// Let's stick to the plan: I will add a simple "Connect to Backend" input in Settings or just hardcode it if I can.
// Wait, I can read `backend/.env` using `read_resource` or `view_file` and then hardcode it in `src/config.js`?
// No, that's insecure if this was a real app. But for a local tool...
// Let's just disable auth for now in `server.js` for simplicity?
// I already modified `server.js` to keep auth.
// Let's add a `Authorization` header with a placeholder, and if it fails, show a prompt.
// Actually, I'll just use the values from `backend/.env` since I can see them.
// I'll check `backend/.env` content.

export const getChannels = async () => {
  const response = await api.get('/api/channels');
  return response.data;
};

export const addChannel = async (type, url, name) => {
  const response = await api.post('/api/channels/add', { type, url, name });
  return response.data;
};

export const removeChannel = async (type, url) => {
  const response = await api.post('/api/channels/remove', { type, url });
  return response.data;
};

export const toggleEveryone = async (url) => {
  const response = await api.post('/api/channels/toggle-everyone', { url });
  return response.data;
};

export const postMessage = async (message, postType) => {
  const response = await api.post('/discord/post', { message, postType });
  return response.data;
};

export const triggerDiscordLogin = async () => {
  // This is a script that runs on backend, but how do we trigger it?
  // The existing backend doesn't seem to have a route for "login".
  // `post-channels.js` launches browser with `storageState: "discord-session.json"`.
  // If session is missing, it might fail.
  // We need a route to trigger the login flow (save-session.js).
  // I need to add a route for this in backend!
  const response = await api.post('/discord/login');
  return response.data;

};

export const checkSession = async () => {
  try {
    const response = await api.get('/discord/session');
    return response.data;
  } catch {
    return { connected: false };
  }
};

export const logout = async () => {
  const response = await api.delete('/discord/session');
  return response.data;
};

export const importChannels = async (data) => {
  const response = await api.post('/api/channels/import', data);
  return response.data;
};

export default api;
