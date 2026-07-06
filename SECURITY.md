# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our software seriously. If you believe you've found a security vulnerability in Micronet, please report it to us responsibly.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email**: Send an email to [SECURITY_EMAIL] with the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if any)

2. **GitHub Security Advisories**: Use [GitHub's private vulnerability reporting](https://github.com/Micronet-world/micronet/security/advisories/new) to report vulnerabilities directly.

### What to Include

When reporting a vulnerability, please include:

- **Type of vulnerability** (e.g., XSS, CSRF, SQL Injection, etc.)
- **Full paths of source file(s) related to the vulnerability**
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration required to reproduce the issue**
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: We will acknowledge receipt of your report within 48 hours.
- **Status Update**: We will provide a status update within 7 days.
- **Resolution**: We aim to release a fix within 30 days of confirming the vulnerability.

### What to Expect

After submitting a report, you can expect:

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours.
2. **Assessment**: We will assess the vulnerability and determine its severity.
3. **Communication**: We will keep you informed of our progress.
4. **Fix**: We will develop and test a fix.
5. **Disclosure**: We will coordinate with you on the timing of public disclosure.
6. **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous).

## Security Best Practices

When using Micronet, please follow these security best practices:

### For Developers

1. **Keep Dependencies Updated**: Regularly update your dependencies to patch known vulnerabilities.

2. **Validate Input**: Always validate and sanitize user input, especially when handling:
   - App manifests
   - Bundle code
   - Storage data
   - External URLs

3. **Use Content Security Policy**: Implement CSP headers to prevent XSS attacks.

4. **Secure Storage**: Use the provided storage abstraction for sensitive data.

5. **Permission System**: Respect and properly implement the permission system for apps.

### For App Developers

1. **Manifest Validation**: Always validate app manifests before loading.

2. **Bundle Integrity**: Verify bundle integrity using hash validation.

3. **Permission Requests**: Only request necessary permissions.

4. **Sandboxing**: Use the SDK's sandboxing features when available.

## Security Features

Micronet includes several security features:

1. **Permission System**: Apps must declare required permissions in their manifest.

2. **Bundle Validation**: Bundles are validated before execution.

3. **Storage Isolation**: App storage is isolated by app ID.

4. **Type Safety**: TypeScript strict mode helps prevent common vulnerabilities.

5. **Input Validation**: The SDK provides validation utilities for manifests and data.

## Known Security Considerations

1. **Bundle Execution**: App bundles are executed using `new Function()`. Ensure only trusted bundles are loaded.

2. **Storage**: The default storage implementation uses localStorage. For sensitive data, consider using a more secure storage solution.

3. **Bluetooth**: The Bluetooth API requires user permission and should be used responsibly.

## Security Updates

Security updates will be released as:

- **Patch versions** for minor vulnerabilities
- **Minor versions** for moderate vulnerabilities
- **Major versions** for critical vulnerabilities

Subscribe to our [GitHub Releases](https://github.com/Micronet-world/micronet/releases) to stay informed about security updates.

## Contact

For security-related questions or concerns, please contact:

- **Email**: [SECURITY_EMAIL]
- **GitHub Security Advisories**: [Private Reporting](https://github.com/Micronet-world/micronet/security/advisories/new)

## Acknowledgments

We would like to thank the following individuals for responsibly disclosing security vulnerabilities:

- [Your name could be here]

## License

This security policy is licensed under [MIT License](LICENSE).
