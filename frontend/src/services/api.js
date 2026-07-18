import axios from "axios";

const API = axios.create({
baseURL: "https://multisupport-ai.onrender.com ",
});

// Request Interceptor: Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Auto-logout on 401 Unauthorized (expired/invalid token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid – clear storage and reload to login screen
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default API;

export const auth = {
  login: (credentials) => API.post("/auth/login", credentials),
  register: (userData) => API.post("/auth/register", userData),
};

export const chat = {
  send: (message, conversation_id = null) =>
    API.post("/chat/", { message, conversation_id }),
  history: () => API.get("/chat/history"),
  search: (query) => API.get(`/chat/search?query=${query}`),
  getConversations: () => API.get("/chat/conversations"),
  getMessages: (conversation_id, limit = 20, skip = 0) =>
    API.get(`/chat/conversations/${conversation_id}/messages`, {
      params: { limit, skip },
    }),
  deleteConversation: (conversation_id) =>
    API.delete(`/chat/conversations/${conversation_id}`),
  updateConversationTitle: (conversation_id, title) =>
    API.put(`/chat/conversations/${conversation_id}/title`, { title }),
};

export const admin = {
  getTickets: (params) => API.get("/admin/tickets", { params }),
  resolveTicket: (ticketId) => API.put(`/admin/ticket/${ticketId}/resolve`),
  updateTicketStatus: (ticketId, status) =>
    API.put(`/admin/ticket/${ticketId}/status`, { status }),
  getTicketDetails: (ticketId) => API.get(`/admin/ticket/${ticketId}`),
  updateTicketPriority: (ticketId, priority) =>
    API.put(`/admin/ticket/${ticketId}/priority`, { priority }),
  assignTicket: (ticketId, agent) =>
    API.put(`/admin/ticket/${ticketId}/assign`, { agent }),
  rateTicket: (ticketId, rating, feedback) =>
    API.put(`/admin/ticket/${ticketId}/rate`, { rating, feedback }),
};

export const dashboard = {
  getStats: () => API.get("/dashboard/stats"),
};

export const documents = {
  upload: (formData) =>
    API.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: () => API.get("/documents/"),
  delete: (documentId) => API.delete(`/documents/${documentId}`),
};