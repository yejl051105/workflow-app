export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date)
  const pad = n => String(n).padStart(2, '0')

  const map = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  }

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => map[match])
}

export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

export function truncate(str, length = 50, suffix = '...') {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + suffix : str
}

export function toKebabCase(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

export function toPascalCase(str) {
  return str.replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase())
}
