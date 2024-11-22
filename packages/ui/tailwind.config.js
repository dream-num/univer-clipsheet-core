const baseConfig = require('@univer-clipsheet-core/tailwindcss-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
    ...baseConfig,
    content: ['./components/**/*.{js,ts,jsx,tsx}', './views/**/*.{js,ts,jsx,tsx}'],
};
