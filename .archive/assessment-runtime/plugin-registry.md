# Plugin Registry

### 1. **Plugin Repository on GitHub**:
The designated GitHub repository stores all plugins as Go binaries. Each plugin is versioned and audited for security.

#### Steps:
1. **Trigger**: Responds to a new pull request or push.
2. **Environment Setup**: Sets up build environnment.
3. **Build Process**: Compiles the source code into Golang binaries.
4. **Artifacts**: Saves the compiled artifacts.

:::info Considerations
- **Caching**: Accelerates builds.
- **Matrix Builds**: Compiles against various environments or configurations.
:::

### 3. **Security Auditing Using GitHub Actions**:
The system automates security checks and audits for plugins.

#### Steps:
1. **Trigger**: Integrates with the compilation workflow or operates as a separate step.
2. **Security Tools**: Employs specialized tools for security.
3. **Sandboxing Checks**: Enforces adherence to sandboxing rules.
4. **Report Generation**: Generates a security report or log.
5. **Conditional Approvals**: Automatically approves, flags for review, or rejects based on results.

:::info Considerations
- **Manual Review Process**: Manages flags raised by automated checks.
- **Integration with Repository**: Enables further actions like merging, creating an issue, or updating a status page.
:::

### 4. **Assessment Runtime Initialization**:
Administrators configure required plugin versions for specific Assessment Runtime instances in the Configuration Service. Upon initialization, the Assessment Runtime pulls this configuration from the control plane and downloads the necessary plugins from the plugin registry.

### 5. **Validation & Security Service**:
The system ensures that downloaded plugins meet security and integrity standards.

:::info Considerations
- **Signature Verification**: Validates that downloaded plugins match audited versions.
- **Compatibility Checks**: Ensures platform compatibility.
:::

### **Conclusion**:
This design capitalizes on GitHub for hosting plugin and GitHub Actions for compiling and security auditing. Administrators define required plugins in a centralized configuration, and the Assessment Runtime initializes by downloading these plugins as configure in the control plane. Leveraging GitHub's infrastructure, this design promotes consistency, automation, and an efficient plugin development lifecycle.
