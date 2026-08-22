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
  // Targeted negative lookahead: only transform ESM packages that actually require
  // CommonJS transpilation, leaving standard CJS packages untouched (#251).
  transformIgnorePatterns: [
    "node_modules/(?!(react-markdown|remark-.*|rehype-.*|unified|hast-.*|mdast-.*|micromark.*|vfile.*|unist-.*|bail|is-plain-obj|trough|zwitch|longest-streak|ccount|escape-string-regexp|markdown-table|trim-lines|decode-named-character-reference|character-entities.*|devlop|comma-separated-tokens|space-separated-tokens|property-information|html-void-elements|html-url-attributes|estree-util-is-identifier-name)/)",
  ],
};

export default config;
