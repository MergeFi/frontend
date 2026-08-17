import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // Runs after the test framework is installed — this is where jest-dom matchers are registered
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Resolve the @/ path alias defined in tsconfig.json
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
    // react-markdown (#89) and its remark/unified/mdast dependency tree
    // ship ESM-only .js — Jest's default CJS require() can't load them
    // straight from node_modules. Transforms just enough (import/export ->
    // require/module.exports) via inline Babel options rather than a root
    // babel.config.js/.babelrc, which would make Next.js silently fall
    // back from its default SWC compiler to Babel for the actual app
    // build — this config only ever runs under Jest.
    "^.+\\.js$": [
      "babel-jest",
      { plugins: ["@babel/plugin-transform-modules-commonjs"] },
    ],
  },
  // react-markdown's dependency tree (remark/rehype/unified/hast/mdast/
  // micromark, and each of *their* sub-dependencies) is too deep to name
  // exhaustively — new transitive packages kept surfacing one at a time.
  // Transform all of node_modules rather than maintain a brittle allowlist;
  // this only affects Jest's test run, never the production build.
  transformIgnorePatterns: [],
};

export default config;
