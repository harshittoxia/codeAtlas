# CodeAtlas

A powerful VS Code extension that performs static analysis on TypeScript/Angular projects to generate interactive call graphs of class and method dependencies. Understand your code architecture at a glance.

**Version:** 0.0.1  
**Status:** Early Development

## Features

- 🔍 **Static Code Analysis** - Analyze TypeScript/Angular projects without executing code
- 📊 **Interactive Call Graph** - Generate visual representations of class and method dependencies
- 🏗️ **Architecture Understanding** - Quickly understand code relationships and dependencies
- ⚡ **Fast Analysis** - Efficient project scanning powered by ts-morph AST analysis
- 🎯 **Single Command** - Simple one-click access to generate call graphs

### Quick Start

1. Open a TypeScript/Angular project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Run the command: **CodeAtlas: Generate Call Graph**

## Requirements

- **VS Code:** Version 1.109.0 or higher
- **Node.js:** Version 22.x or higher (for development)
- **Project Type:** TypeScript or Angular projects

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/harshittoxia/codeAtlas.git
   cd codeatlas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

4. Open in VS Code and press `F5` to launch the extension host

### From VS Code Extensions Marketplace

CodeAtlas will be available on the VS Code Marketplace (coming soon).

## Development Setup

### Available Commands

- **Development Build:**
  ```bash
  npm run compile
  ```

- **Watch Mode** (auto-rebuild on changes):
  ```bash
  npm run watch
  ```

- **Type Checking:**
  ```bash
  npm run check-types
  ```

- **Linting:**
  ```bash
  npm run lint
  ```

- **Testing:**
  ```bash
  npm run test
  ```

- **Production Build:**
  ```bash
  npm run package
  ```

### Project Structure

```
codeatlas/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── commands/
│   │   └── generateMap.ts        # Generate call graph command
│   ├── parser/
│   │   └── projectScanner.ts     # Project scanning and analysis
│   ├── types/
│   │   └── graphTypes.ts         # Type definitions
│   └── test/
│       └── extension.test.ts     # Extension tests
├── dist/                          # Compiled output (generated)
├── esbuild.js                    # Build configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
├── package.json                  # Project dependencies
└── README.md                      # This file
```

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TypeScript** | 5.9.3 | Language and type safety |
| **VS Code API** | 1.109.0 | Extension development |
| **ts-morph** | 27.0.2 | TypeScript AST manipulation |
| **ESBuild** | 0.27.2 | Fast bundling |
| **ESLint** | 9.39.2 | Code linting |
| **Mocha** | 10.8.2 | Testing framework |
| **Node.js** | 22.x | Runtime |

## Extension Manifest

The extension contributes the following command:

- **`codeatlas.generateMap`** - Generates a call graph for the currently open TypeScript/Angular project

## Known Issues

- Initial release - feature set is still being expanded
- Performance may vary on very large projects (optimization in progress)

## Release Notes

### 0.0.1 (Initial Release)

- Initial development release
- Basic project scanning functionality
- Call graph generation for TypeScript projects
- VS Code extension integration

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all tests pass and code is properly linted before submitting a PR.

## License

This project is open source. See the repository for license details.

## Resources

- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [ts-morph Documentation](https://ts-morph.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For issues, questions, or feature requests, please visit the [GitHub repository](https://github.com/harshittoxia/codeAtlas).
