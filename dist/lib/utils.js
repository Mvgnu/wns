"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatDate = formatDate;
exports.formatTime = formatTime;
exports.formatDateTime = formatDateTime;
exports.truncate = truncate;
exports.getInitials = getInitials;
exports.truncateText = truncateText;
exports.slugify = slugify;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
/**
 * Merges class names using clsx and tailwind-merge
 * This allows for conditional classes and resolves conflicts
 */
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
/**
 * Format a date to a locale string
 */
function formatDate(date) {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
/**
 * Format a time to a locale string
 */
function formatTime(date) {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
/**
 * Format a date and time to a locale string
 */
function formatDateTime(date) {
    if (!date)
        return '';
    return `${formatDate(date)}, ${formatTime(date)}`;
}
/**
 * Truncate a string to a certain length
 */
function truncate(str, length) {
    if (!str)
        return '';
    return str.length > length ? `${str.substring(0, length)}...` : str;
}
/**
 * Get initials from a name
 */
function getInitials(name) {
    if (!name)
        return '';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}
/**
 * Truncates a string to a specified length and adds an ellipsis
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength) + '...';
}
/**
 * Creates URL-friendly slug from a string
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}
