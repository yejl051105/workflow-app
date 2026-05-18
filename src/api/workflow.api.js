import { api } from './request'

export const workflowApi = {
  save(data) {
    return api.post('/workflow/save', data)
  },

  load(id) {
    return api.get(`/workflow/${id}`)
  },

  list() {
    return api.get('/workflow/list')
  },

  delete(id) {
    return api.delete(`/workflow/${id}`)
  },
}
