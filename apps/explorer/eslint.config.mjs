import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    // React Compiler plugin rules — disabled because this project does not use React Compiler.
    // The plugin is bundled with eslint-config-next v16 but its rules assume opt-in to the compiler.
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
];
