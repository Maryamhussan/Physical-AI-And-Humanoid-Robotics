// Theme integration utilities for Docusaurus compatibility

// Function to get the current Docusaurus theme variables
export const getDocusaurusThemeVariables = () => {
  const rootStyles = getComputedStyle(document.documentElement);

  return {
    // Colors
    primary: rootStyles.getPropertyValue('--ifm-color-primary') || '#3578e5',
    primaryDark: rootStyles.getPropertyValue('--ifm-color-primary-dark') || '#2c66c4',
    primaryDarker: rootStyles.getPropertyValue('--ifm-color-primary-darker') || '#2a60b9',
    primaryDarkest: rootStyles.getPropertyValue('--ifm-color-primary-darkest') || '#224f96',
    primaryLight: rootStyles.getPropertyValue('--ifm-color-primary-light') || '#4d89e9',
    primaryLighter: rootStyles.getPropertyValue('--ifm-color-primary-lighter') || '#5d93eb',
    primaryLightest: rootStyles.getPropertyValue('--ifm-color-primary-lightest') || '#d3e0fa',

    // Emphasis colors
    emphasis100: rootStyles.getPropertyValue('--ifm-color-emphasis-100') || '#f6f6f7',
    emphasis200: rootStyles.getPropertyValue('--ifm-color-emphasis-200') || '#ebedf0',
    emphasis300: rootStyles.getPropertyValue('--ifm-color-emphasis-300') || '#dfe1e5',
    emphasis400: rootStyles.getPropertyValue('--ifm-color-emphasis-400') || '#c9ccd1',
    emphasis500: rootStyles.getPropertyValue('--ifm-color-emphasis-500') || '#a0a2a7',
    emphasis600: rootStyles.getPropertyValue('--ifm-color-emphasis-600') || '#808080',
    emphasis700: rootStyles.getPropertyValue('--ifm-color-emphasis-700') || '#525860',
    emphasis800: rootStyles.getPropertyValue('--ifm-color-emphasis-800') || '#353738',
    emphasis900: rootStyles.getPropertyValue('--ifm-color-emphasis-900') || '#1c1e21',

    // Background colors
    background: rootStyles.getPropertyValue('--ifm-background-color') || '#ffffff',
    backgroundSurface: rootStyles.getPropertyValue('--ifm-background-surface-color') || '#ffffff',
    backgroundContent: rootStyles.getPropertyValue('--ifm-background-content-color') || '#ffffff',

    // Font colors
    fontColorBase: rootStyles.getPropertyValue('--ifm-font-color-base') || '#242526',
    fontColorSecondary: rootStyles.getPropertyValue('--ifm-color-content-secondary') || '#525860',

    // Font properties
    fontFamilyBase: rootStyles.getPropertyValue('--ifm-font-family-base') || 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
    fontSizeBase: rootStyles.getPropertyValue('--ifm-font-size-base') || '1rem',
    lineHeightBase: rootStyles.getPropertyValue('--ifm-line-height-base') || '1.6',

    // Spacing
    spacingUnit: rootStyles.getPropertyValue('--ifm-spacing-unit') || '1rem',
    globalPadding: rootStyles.getPropertyValue('--ifm-global-padding') || '2rem',
    globalRadius: rootStyles.getPropertyValue('--ifm-global-radius') || '0.4rem',

    // Shadow
    shadowMd: rootStyles.getPropertyValue('--ifm-shadow-md') || '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    shadowLg: rootStyles.getPropertyValue('--ifm-shadow-lg') || '0 4px 12px 0 rgba(0, 0, 0, 0.1)',

    // Transition
    transitionFast: rootStyles.getPropertyValue('--ifm-transition-fast') || '0.1s',
    transitionMedium: rootStyles.getPropertyValue('--ifm-transition-medium') || '0.2s',
    transitionSlow: rootStyles.getPropertyValue('--ifm-transition-slow') || '0.3s',
    transitionTiming: rootStyles.getPropertyValue('--ifm-transition-timing-default') || 'ease',
  };
};

// Function to apply Docusaurus theme to a specific element or component
export const applyDocusaurusTheme = (element, themeOverrides = {}) => {
  const themeVars = getDocusaurusThemeVariables();
  const finalTheme = { ...themeVars, ...themeOverrides };

  // Apply theme variables as CSS custom properties to the element
  Object.entries(finalTheme).forEach(([key, value]) => {
    element.style.setProperty(`--chatbot-theme-${key}`, value);
  });

  return finalTheme;
};

// React hook to access Docusaurus theme in components
export const useDocusaurusTheme = (overrides = {}) => {
  // In a real React component, we'd use useEffect and useState
  // This is a utility function that returns the theme values
  const themeVars = getDocusaurusThemeVariables();
  return { ...themeVars, ...overrides };
};

// Function to create a theme context for chatbot components
export const createThemeContext = (overrides = {}) => {
  const theme = getDocusaurusThemeVariables();
  const context = { ...theme, ...overrides };

  // Create CSS class names that can be used in components
  const themeClasses = {
    container: 'chatbot-theme-container',
    primaryButton: 'chatbot-theme-primary-button',
    secondaryButton: 'chatbot-theme-secondary-button',
    input: 'chatbot-theme-input',
    card: 'chatbot-theme-card',
    textPrimary: 'chatbot-theme-text-primary',
    textSecondary: 'chatbot-theme-text-secondary',
  };

  return {
    ...context,
    classes: themeClasses,
    // Function to generate theme CSS
    generateThemeCSS: () => {
      return `
        .chatbot-theme-container {
          background-color: ${context.backgroundSurface};
          color: ${context.fontColorBase};
          border-radius: ${context.globalRadius};
        }

        .chatbot-theme-primary-button {
          background-color: ${context.primary};
          color: white;
          border: 1px solid ${context.primary};
          border-radius: calc(${context.globalRadius} * 0.8);
        }

        .chatbot-theme-primary-button:hover {
          background-color: ${context.primaryDark};
          border-color: ${context.primaryDark};
        }

        .chatbot-theme-secondary-button {
          background-color: ${context.backgroundSurface};
          color: ${context.fontColorBase};
          border: 1px solid ${context.emphasis300};
          border-radius: calc(${context.globalRadius} * 0.8);
        }

        .chatbot-theme-input {
          background-color: ${context.emphasis100};
          color: ${context.fontColorBase};
          border: 1px solid ${context.emphasis300};
          border-radius: calc(${context.globalRadius} * 0.8);
        }

        .chatbot-theme-card {
          background-color: ${context.backgroundSurface};
          border: 1px solid ${context.emphasis200};
          border-radius: ${context.globalRadius};
          box-shadow: ${context.shadowMd};
        }

        .chatbot-theme-text-primary {
          color: ${context.fontColorBase};
        }

        .chatbot-theme-text-secondary {
          color: ${context.fontColorSecondary};
        }
      `;
    }
  };
};

// Function to check if dark mode is active
export const isDarkMode = () => {
  // Check for dark mode using the same method Docusaurus uses
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return darkModeMediaQuery.matches;
};

// Function to add dark mode support to chatbot components
export const addDarkModeSupport = (element) => {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const updateDarkMode = (e) => {
    if (e.matches) {
      element.classList.add('chatbot-dark-mode');
    } else {
      element.classList.remove('chatbot-dark-mode');
    }
  };

  // Initialize
  updateDarkMode(darkModeMediaQuery);

  // Listen for changes
  darkModeMediaQuery.addEventListener('change', updateDarkMode);

  return () => {
    darkModeMediaQuery.removeEventListener('change', updateDarkMode);
  };
};

export default {
  getDocusaurusThemeVariables,
  applyDocusaurusTheme,
  useDocusaurusTheme,
  createThemeContext,
  isDarkMode,
  addDarkModeSupport
};