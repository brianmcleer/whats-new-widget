// Type-only shim for Visual Studio when pnpm symlinks hide Emotion's JSX runtime.
declare module '@emotion/react/jsx-runtime' {
  export * from 'react/jsx-runtime'
}
