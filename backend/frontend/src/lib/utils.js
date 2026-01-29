import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return 'TBD';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date) {
  if (!date) return 'TBD';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatTime(date) {
  if (!date) return 'TBD';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getTimeRemaining(endTime) {
  const total = new Date(endTime) - new Date();
  
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

export function truncate(str, length = 100) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getMatchStatusColor(status) {
  const colors = {
    upcoming: 'text-blue-500 bg-blue-500/10',
    live: 'text-green-500 bg-green-500/10',
    completed: 'text-gray-500 bg-gray-500/10',
    cancelled: 'text-red-500 bg-red-500/10',
  };
  return colors[status] || colors.upcoming;
}

export function getGameIcon(gameType) {
  const icons = {
    'PUBG Mobile': '🎮',
    'Free Fire': '🔥',
    'BGMI': '🎯',
  };
  return icons[gameType] || '🎮';
}

export function getMatchTypeLabel(matchType) {
  const labels = {
    solo: 'Solo',
    duo: 'Duo',
    squad: 'Squad',
  };
  return labels[matchType] || matchType;
}

export function getModeLabel(mode) {
  const labels = {
    classic: 'Classic',
    tdm: 'TDM',
    arena: 'Arena',
  };
  return labels[mode] || mode;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

export function validatePassword(password) {
  return password.length >= 8;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
