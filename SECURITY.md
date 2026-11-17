# 🔒 Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in this project, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Instead, please open a [private security advisory](https://github.com/ahmedqassimtv-commits/QassimChannel/security/advisories/new) on this repository
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment** within 48 hours of your report
- **Assessment** of the vulnerability within 1 week
- **Fix & Disclosure** coordinated with you before public announcement

### Scope

This is a static front-end application deployed on GitHub Pages. The scope includes:

- Cross-site scripting (XSS) vulnerabilities
- Dependency vulnerabilities in npm packages
- Sensitive data exposure in client-side code
- Build configuration security issues

### Out of Scope

- Vulnerabilities in third-party services (YouTube, GitHub Pages infrastructure)
- Social engineering attacks
- Denial of service attacks against GitHub Pages

## Security Best Practices

This project follows these security practices:

- Dependencies are regularly reviewed for known vulnerabilities
- Production builds strip `console` and `debugger` statements
- No sensitive credentials or API keys are stored in the repository

## Thank You

Thank you for helping keep QassimChannel and its users safe! 🙏
