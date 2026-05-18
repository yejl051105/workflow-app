const BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request(url, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error)
  }

  return response.json()
}

export const api = {
  get(url, params) {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`${url}${query}`, { method: 'GET' })
  },

  post(url, data) {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put(url, data) {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete(url) {
    return request(url, { method: 'DELETE' })
  },

  upload(url, formData) {
    const token = localStorage.getItem('token')
    return fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new ApiError(`Upload failed: ${res.status}`, res.status)
      return res.json()
    })
  },
}

export { ApiError }
