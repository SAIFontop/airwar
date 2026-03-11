export type Theme = 'dark' | 'light'

let currentTheme: Theme = 'dark'

export function setTheme(theme: Theme) {
  currentTheme = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.classList.toggle('light', theme === 'light')
}

export function getTheme(): Theme {
  return currentTheme
}

export function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark')
}
