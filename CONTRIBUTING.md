# Contributing to Cyber Kiosk

Thank you for considering contributing to Cyber Kiosk! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Raspberry Pi model, OS version, Node version)
- Screenshots if applicable

### Suggesting Features

Feature suggestions are welcome! Please create an issue describing:
- The feature and its use case
- Why it would be valuable
- Any implementation ideas (optional)

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cyber-kiosk.git
   cd cyber-kiosk
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Test your changes thoroughly
   - Update documentation if needed
   - Add comments for complex logic

4. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: description of what you added"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub with a clear description.

## Development Guidelines

### Code Style

- **JavaScript**: Use ES6+ features, clear variable names, consistent indentation
- **CSS**: Follow existing naming conventions, use CSS variables for colors
- **HTML**: Semantic markup, accessible structure

### Testing

Before submitting a PR:
- Test on actual Raspberry Pi hardware if possible
- Verify the system monitor runs without errors
- Check all API integrations work
- Test in kiosk mode (fullscreen Chromium)

### Documentation

- Update README.md if adding features
- Add/update docs/ files for complex features
- Include code comments for non-obvious logic
- Update config.example.json if adding new config options

## Project Structure

```
cyber-kiosk/
├── index.html              # Main dashboard UI
├── css/style.css          # Cyberpunk styling
├── js/app.js              # Frontend logic
├── system-monitor.js      # Backend system stats server
├── config.example.json    # Config template
├── docs/                  # Documentation
└── setup.sh               # Installation script
```

## Feature Ideas

Some areas where contributions would be especially valuable:

- **Widgets**: New data sources (crypto, sports, tech news)
- **Themes**: Alternative color schemes or visual styles
- **System Stats**: Additional metrics or visualizations
- **Mobile Support**: Responsive design improvements
- **Accessibility**: Screen reader support, keyboard navigation
- **Internationalization**: Multi-language support
- **Performance**: Optimization for older Raspberry Pi models
- **Documentation**: Tutorials, videos, better examples

## Questions?

Open an issue with the `question` label or start a discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Cyber Kiosk better! 🚀**
