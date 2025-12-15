
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * A helper function to handle fetch responses.
 * @param {Response} response - The response from a fetch call.
 * @returns {Promise<any>} - The JSON data from the response.
 * @throws {Error} - Throws an error if the response is not ok.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<any>} - The user data from the response.
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

/**
 * Fetches all tasks/requests relevant for NGOs.
 * Assumes the backend has an endpoint like GET /api/tasks
 */
export const getTasks = async () => {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  return handleResponse(response);
};

/**
 * Fetches all available volunteers.
 * Assumes the backend has an endpoint like GET /api/volunteers
 */
export const getVolunteers = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required to fetch volunteers.');
  }
  const response = await fetch(`${API_BASE_URL}/dashboard/volunteers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

/**
 * Assigns a volunteer to a specific task.
 * Assumes the backend has an endpoint like PUT /api/tasks/:taskId/assign
 * @param {string} taskId - The ID of the task.
 * @param {string} volunteerId - The ID of the volunteer to assign.
 */
export const assignTask = async (taskId, volunteerId, token) => {
  if (!token) {
    throw new Error('Authentication token is required for this action.');
  }
  const response = await fetch(`${API_BASE_URL}/requests/${taskId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ volunteerId }),
  });
  return handleResponse(response);
};

/**
 * Fetches all the data needed for the main NGO dashboard.
 * @param {string} ngoId - The ID of the logged-in NGO.
 */
export const getNgoDashboardData = async (ngoId, token) => {
  if (!token) {
    throw new Error('Authentication token is required.');
  }
  const response = await fetch(`${API_BASE_URL}/ngos/${ngoId}/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

/**
 * Allows an NGO to accept a task, assigning it to their management.
 * @param {string} taskId - The ID of the task to accept.
 * @param {string} ngoId - The ID of the NGO accepting the task.
 */
export const acceptNgoTask = async (taskId, ngoId) => {
  const response = await fetch(`${API_BASE_URL}/ngos/tasks/${taskId}/accept`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ngoId }),
  });
  return handleResponse(response);
};

/**
 * Allows an NGO to accept a coordination task/request from their dashboard.
 * @param {string} ngoId - The ID of the NGO accepting the task.
 * @param {string} requestId - The ID of the request to accept.
 */
export const acceptCoordinationTask = async (ngoId, requestId, token) => {
  if (!token) {
    throw new Error('Authentication token is required for this action.');
  }
  const response = await fetch(`${API_BASE_URL}/ngos/${ngoId}/requests/${requestId}/accept`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // No body is needed as IDs are in the URL, but you could pass one for verification.
  });
  return handleResponse(response);
};

/**
 * Deploys a resource, updating its status.
 * @param {string} resourceId - The ID of the resource to deploy.
 * @param {string} token - The auth token for the user.
 * @returns {Promise<any>}
 */
export const deployResource = async (resourceId, token) => {
  if (!token) {
    throw new Error('Authentication token is required for this action.');
  }
  const response = await fetch(`${API_BASE_URL}/ngo-resources/${resourceId}/deploy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

/**
 * Creates a new resource request from the emergency dashboard.
 * @param {object} requestData - The data for the resource request.
 * @returns {Promise<any>}
 */
export const createResourceRequest = async (requestData) => {
  // Get user info from local storage to access the token.
  // Your login flow should save this object.
  const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

  if (!userInfo || !userInfo.token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`${API_BASE_URL}/requests/resource`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userInfo.token}`, // Add the required auth header
    },
    body: JSON.stringify({
      ...requestData,
      requestType: 'Resource', // Explicitly set the type
    }),
  });

  return handleResponse(response);
};

/**
 * Fetches all data for the main emergency overview dashboard.
 */
export const getEmergencyOverview = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required.');
  }
  const response = await fetch(`${API_BASE_URL}/dashboard/emergency-overview`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

/**
 * Fetches all data for the volunteer dashboard.
 * @param {string} token - The auth token for the logged-in volunteer.
 * @returns {Promise<any>}
 */
export const getVolunteerDashboardData = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required.');
  }
  const response = await fetch(`${API_BASE_URL}/dashboard/volunteer`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

// Add other API functions as needed, e.g., updateTaskStatus, getTaskDetails, etc.
