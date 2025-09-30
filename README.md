# Struct Forge

[![Build dev](https://github.com/aecoder-br/structforge/actions/workflows/ci-dev.yml/badge.svg)](https://github.com/aecoder-br/structforge/actions/workflows/ci-dev.yml)
[![Build main](https://github.com/aecoder-br/structforge/actions/workflows/ci-main.yml/badge.svg)](https://github.com/aecoder-br/structforge/actions/workflows/ci-main.yml)
[![License](https://img.shields.io/github/license/aecoder-br/structforge.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/aecoder-br/structforge.svg?style=social)](https://github.com/aecoder-br/structforge)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/structforge.svg)](https://www.npmjs.com/package/structforge)

A CLI that turns text trees into real folder and file structures.
It supports:

* ASCII trees like `tree` with `│ ├ └ ─`
* Space-indented lists
* Path lines like `.github/workflows/ci.yml` or `src/index.ts`
* End-of-line comments such as `# ...` and trailing parenthetical notes like `(optional, ...)`

No runtime dependencies, TypeScript only for build.

## Local install

```bash
# (optional) pin pnpm via Corepack and use the frozen lockfile (same as CI)
corepack enable
corepack prepare pnpm@9 --activate
pnpm i --frozen-lockfile
pnpm build
pnpm test
```

```bash
pnpm i
pnpm build
node dist/cli.js --help
```

or run with ts-node

```bash
pnpm dev -- --help
```

## Usage

Input comes from `--from` or stdin.

```bash
node dist/cli.js --root . --infer-root --gitkeep --from tree.txt
# or
cat tree.txt | node dist/cli.js --root . --infer-root
```

### Run modes

#### 1) Global (installed from npm)

After `npm i -g structforge`:

```bash
# Linux/macOS
structforge --root /tmp/out --infer-root --from ./tree.txt
# or piping inline text
cat <<'EOF' | structforge --root /tmp/out --infer-root --verbose
my-app/
  src/
    index.ts
  package.json
EOF
```

```powershell
# Windows PowerShell
structforge --root "D:\out" --infer-root --from .\tree.txt
@"
my-app/
  src/
    index.ts
  package.json
"@ | structforge --root "D:\out" --infer-root --verbose
```

#### 2) Local (using the built dist of this repo)

```bash
pnpm i && pnpm build
node dist/cli.js --root /tmp/out --infer-root --from ./tree.txt
# or
cat tree.txt | node dist/cli.js --root /tmp/out --infer-root
```

#### 3) Dev (ts-node, without building)

```bash
pnpm i
pnpm dev -- --root /tmp/out --infer-root --from ./tree.txt
# or
cat tree.txt | pnpm dev -- --root /tmp/out --infer-root
```

Tips:

* Preview first:

  ```bash
  structforge --root /tmp/out --infer-root --dry-run --from ./tree.txt
  ```
* Create placeholders for empty dirs: add `--gitkeep`.
* Increase logs: add `--verbose`.

### Input rules (read carefully)

* **Do not add comments or annotations** in the structure. Only list directories and files.

  * ❌ Don’t use trailing notes like `# ...` or `(optional ...)`.
* **Directories must end with `/`** to be recognized as folders.
* **Files** can have an extension (e.g. `index.ts`) **or not** (e.g. `Dockerfile`, `LICENSE`).

**Correct**

```
example-api/
├─ app/
│  ├─ main.py
│  ├─ core/
│  │  ├─ settings.py
│  │  └─ logging.py
├─ Dockerfile
└─ README.md
```

**Incorrect**

```
example-api/
├─ app/
│  ├─ main.py
│  ├─ core/
│  │  ├─ settings.py          # global settings
│  │  └─ logging.py          # any other comments 
│  ├─ api/
│  │  ├─ routers/
│  │  │  ├─ users.py
│  │  └─ errors.py
│  └─ utils/
│     └─ http.py 
├─ Dockerfile                     # optional 
└─ README.md
```

Key options:

* `--root <dir>` output root directory, default `.`
* `--infer-root` uses the first line that ends with `/` as sub root, for example `my-project/`
* `--gitkeep` creates `.gitkeep` inside empty directories
* `--dry-run` prints the plan and does not create anything
* `--verbose` logs each created item
* `--from <file>` read input from a file, otherwise read stdin

## Examples

### 1) Simple indented list

```
my-project/
  src/
    index.ts
    app.ts
    utils.ts
  test/
    app.test.ts
  package.json
  tsconfig.json
  README.md
```

### 2) Box drawing characters

```
example-api/
├─ app/
│  ├─ main.py
│  ├─ core/
│  │  ├─ settings.py
│  │  └─ logging.py
│  ├─ api/
│  │  ├─ routers/
│  │  │  ├─ users.py
│  │  │  └─ items.py
│  │  └─ errors.py
│  └─ utils/
│     └─ http.py
├─ requirements.txt
├─ .env.example
├─ Dockerfile
└─ README.md
```

### 3) Web library with dotted folders

```
ui-library/
  package.json
  tsconfig.json
  .eslintrc.cjs
  .prettierrc
  .gitignore
  LICENSE
  README.md
  src/
    index.ts
    components/Button.tsx
    components/Card.tsx
    hooks/useToggle.ts
    internal/createClassName.ts
  tests/
    button.test.tsx
  .github/workflows/ci.yml
  examples/
```

## Contributing

Target branch for pull requests: `dev`. The `main` branch is protected and represents the latest stable version.

### Workflow

1. Fork the repo or create a feature branch from `dev`.
2. Branch name format: `feat/<short-topic>` or `fix/<short-topic>`.
3. Make changes and add tests when applicable.
4. Run `pnpm build` and `pnpm test` locally.
5. Open a PR to `dev`. Fill the PR template.
6. After approval, squash and merge into `dev`.
7. Release to `main` by opening a PR `dev -> main`.

### Commit style

Use clear, present-tense messages. Conventional Commits is recommended, for example:

* `feat(parser): support dashed bullets`
* `fix(cli): handle empty stdin`

### Code style

* TypeScript strict mode
* No runtime dependencies
* Keep public API stable in `src/index.ts`

### Tests

* Node test runner
* Add minimal parser cases for new syntaxes

### CI

CI runs on pushes and PRs to `dev` and `main`. The status badges above use `ci-dev.yml` and `ci-main.yml`.

## Release

1. Merge `dev` into `main` with a PR.
2. Create a GitHub Release with semantic version. Tag format `vX.Y.Z`.

## Safety

* Blocks `..` to prevent traversal
* Normalizes cross-platform paths
* Skips overwriting existing files

## License

MIT, see `LICENSE` file.

## Tests

```bash
pnpm test
```
