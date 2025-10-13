# Root Directory Cleanup Plan

## Objective
Organize the root directory to enterprise standards by moving all loose documentation files into appropriate folders.

## Current State Analysis

### Root Directory Files to Organize
1. `ACCESSIBILITY_FEATURES.md` - Marketing site accessibility documentation
2. `COMPONENT_API.md` - Marketing site component API documentation
3. `DEPLOYMENT_GUIDE.md` - Marketing site deployment guide
4. `MARKETING_SITE_DOCUMENTATION.md` - Marketing site overview
5. `THEME_SYSTEM.md` - Marketing site theme system documentation

### Files to Keep in Root
- `README.md` - Main project README (stays in root)
- `CONTRIBUTING.md` - Contribution guidelines (stays in root)
- `package.json` - Root package configuration (stays in root)
- `package-lock.json` - Lock file (stays in root)
- `.gitignore` - Git configuration (stays in root)

## Organization Strategy

### Create New Documentation Structure
```
docs/
├── marketing-site/          # NEW - Marketing site documentation
│   ├── README.md           # Overview and index
│   ├── ACCESSIBILITY_FEATURES.md
│   ├── COMPONENT_API.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── MARKETING_SITE_DOCUMENTATION.md
│   └── THEME_SYSTEM.md
├── development/            # Existing - Development docs
├── migration/              # Existing - Migration docs
├── testing/                # Existing - Testing docs
└── [other existing docs]
```

## Actions to Take

1. ✅ Create `docs/marketing-site/` directory
2. ✅ Move marketing site documentation files
3. ✅ Create index README for marketing-site folder
4. ✅ Update main README.md to reference new structure
5. ✅ Verify all links still work
6. ✅ Create cleanup summary

## Expected Result

**Root Directory After Cleanup:**
```
.
├── .git/
├── .github/
├── .kiro/
├── .vscode/
├── backend/
├── docker/
├── docs/                    # All documentation organized here
├── frontend/
├── node_modules/
├── scripts/
├── tests/
├── .gitignore
├── CONTRIBUTING.md          # Contribution guidelines
├── package.json             # Root package config
├── package-lock.json        # Lock file
└── README.md                # Main project README
```

**Benefits:**
- Clean, professional root directory
- All documentation properly organized
- Easy to find specific documentation
- Follows enterprise standards
- Better maintainability
