// This package has no bundler of its own (Next.js/Vite consumers supply
// their own CSS Modules typing via next-env.d.ts / vite/client), so a
// standalone `tsc --noEmit` here needs this declared explicitly.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
