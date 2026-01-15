# MPP eLearning Suite

Unified eLearning platform for the DoD Mentor-Protege Program (MPP) Portal.

## Overview

This suite combines two training resources into a single platform:

| Module | Description | Source |
|--------|-------------|--------|
| **Portal Dashboard** | 20-page static HTML dashboard | mpp-dashboard @ `eb3ca1a` |
| **Interactive Training** | Guided walkthrough with voiceover | mpp-interactive-training @ `e7e0433` |

## Quick Start

```bash
# Serve locally
npx serve -l 3000 .

# Open in browser
# http://localhost:3000
```

## Project Structure

```
mpp-elearning-suite/
├── index.html              # Landing page with links to both modules
├── dashboard/              # Static MPP Portal (20 pages)
│   ├── index.html          # Redirects to Dashboard.html
│   ├── Dashboard.html      # Main dashboard
│   ├── Agreements.html     # DFARS compliance
│   ├── About MPP.html      # Program info
│   └── ...                 # 17 more pages
├── training/               # Interactive training module
│   ├── index.html          # Training app with tour
│   └── modal-config-mode.js
└── README.md
```

## Modules

### Portal Dashboard (`/dashboard/`)

Complete static HTML version of the MPP Portal with:
- 20 fully functional pages
- Working navigation between all sections
- Agreements, Applications, Resources, Team Management
- 508-compliant for government use

### Interactive Training (`/training/`)

Guided learning experience with:
- Welcome modal with ElevenLabs voiceover
- 8-step Shepherd.js guided tour
- 7 interactive hotspots with detailed content
- Form simulation with validation
- 5-question knowledge check quiz
- Progress tracking with localStorage
- Modal config mode (Ctrl+Shift+P)

## Source Commits

This suite was created by combining specific commits from two repositories:

- **Dashboard**: `mpp-dashboard` commit `eb3ca1a` (Jan 11, 2026)
- **Training**: `mpp-interactive-training` commit `e7e0433` (Jan 7, 2026)

## License

Proprietary - DoD Mentor-Protege Program
