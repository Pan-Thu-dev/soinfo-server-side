# Git Flow Workflow

This project follows the Git Flow workflow for development. Below are the guidelines for working with this repository.

## Branch Structure

### Main Branches

#### `main` (or `master`)
- Contains production-ready code
- Never commit directly to main
- Only accepts merges from:
  - hotfix/* branches
  - release/* branches
- Must be tagged with version number after each merge

#### `develop`
- Main development branch
- Contains latest delivered development changes
- Source branch for feature branches
- Never commit directly to develop

### Supporting Branches

#### `feature/*`
- Branch from: develop
- Merge back into: develop
- Naming convention: feature/[descriptive-name]
- Example: feature/user-authentication
- Must be up-to-date with develop before creating PR
- Delete after merge

#### `release/*`
- Branch from: develop
- Merge back into: 
  - main
  - develop
- Naming convention: release/vX.Y.Z
- Example: release/v1.2.0
- Only bug fixes, documentation, and release-oriented tasks
- No new features
- Delete after merge

#### `hotfix/*`
- Branch from: main
- Merge back into:
  - main
  - develop
- Naming convention: hotfix/vX.Y.Z
- Example: hotfix/v1.2.1
- Only for urgent production fixes
- Delete after merge

## Commit Messages

- Format: `type(scope): description`
- Types:
  - feat: New feature
  - fix: Bug fix
  - docs: Documentation changes
  - style: Formatting, missing semicolons, etc.
  - refactor: Code refactoring
  - test: Adding tests
  - chore: Maintenance tasks

## Version Control

### Semantic Versioning
- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality
- PATCH version for backwards-compatible bug fixes

## Pull Request Rules

1. All changes must go through Pull Requests
2. Required approvals: minimum 1
3. CI checks must pass
4. No direct commits to protected branches (main, develop)
5. Branch must be up to date before merging
6. Delete branch after merge

## Development Workflow

1. Start a new feature:
   ```
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, commit with appropriate message format:
   ```
   git commit -m "feat(component): add new button component"
   ```

3. Push your feature branch:
   ```
   git push -u origin feature/your-feature-name
   ```

4. Create a Pull Request to merge into develop

5. After approval and CI checks pass, merge into develop

6. Delete the feature branch after merging 