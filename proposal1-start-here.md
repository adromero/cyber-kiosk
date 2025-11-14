# Proposal 1: Responsive Multi-Theme Cyber Kiosk - Start Here

## Overview

This document provides instructions for Claude Code to work incrementally on **Proposal 1: Responsive Multi-Theme Cyber Kiosk**. The project is designed to be completed across multiple Claude sessions, with automatic progress tracking and handoff between sessions.

---

## Project Goal

Transform the current cyber-kiosk into a **device-agnostic, highly customizable dashboard system** that:

1. **Adapts seamlessly** from 4-inch mobile screens to 27-inch desktop displays
2. **Supports multiple themes** (Cyberpunk, Hip-Hop, California)
3. **Allows user-configurable panels** (Weather, Markets, News, Timer, Music, etc.)
4. **Maintains backward compatibility** with existing installations

---

## How This System Works

### Progress Tracking System

- **`proposal1-progress.json`**: Tracks all tasks, their status, dependencies, and session history
- **`proposal1-start-here.md`** (this file): Instructions for Claude on how to work on this project
- **Context management**: When context reaches 40% remaining (80,000 tokens used), Claude should save progress and prepare handoff

### Claude's Workflow

1. **Read this file** to understand the overall goal
2. **Read `proposal1-progress.json`** to see current progress and next tasks
3. **Read `PROPOSAL_1_RESPONSIVE_KIOSK.md`** for detailed specifications (optional, if context allows)
4. **Work on pending tasks** in priority order, respecting dependencies
5. **Update `proposal1-progress.json`** as you complete tasks
6. **Monitor context usage** - when you reach 60% context used (120,000 tokens), prepare for handoff
7. **At 40% context remaining** (160,000 tokens used): Save final progress and create handoff notes

---

## Claude Instructions: Step-by-Step

### Step 1: Initialize Session

When you start working on this project:

1. Read `proposal1-progress.json` to understand current state
2. Check `currentPhase` to see which phase you're working on
3. Review `notes.nextSteps` for guidance on what to do next
4. Check `notes.blockers` for any issues that need resolution

### Step 2: Select Tasks to Work On

From `proposal1-progress.json`:

1. Find tasks with `status: "pending"` in the current phase
2. Check task `dependencies` - only work on tasks whose dependencies are complete
3. Prioritize tasks marked `priority: "high"`
4. Select 2-4 related tasks to work on in this session

### Step 3: Work on Tasks

For each task:

1. **Before starting**: Update task status to `"in_progress"` in progress.json
2. **Do the work**: Create files, write code, test functionality
3. **After completing**: Update task status to `"completed"` and add notes if needed
4. **Track file changes**: Update `fileChanges.created` or `fileChanges.modified` arrays

### Step 4: Test Your Changes

- **For layout/UI changes**: Test on the 7-inch Pi screen using the browser
- **For new features**: Verify functionality works as expected
- **For theme changes**: Switch between themes and verify appearance
- **Document any issues** in the task `notes` field

### Step 5: Update Progress JSON

After completing each task, update `proposal1-progress.json`:

```json
{
  "id": "p1-t1",
  "description": "Create css/responsive.css with mobile-first breakpoints",
  "status": "completed",  // Changed from "pending"
  "priority": "high",
  "dependencies": [],
  "notes": "Created responsive.css with 5 breakpoints. Tested on 7-inch screen successfully."
}
```

Also update:
- `lastUpdated`: Current timestamp
- `contextUsedPercent`: Your current context usage percentage
- `overallProgress.completedTasks`: Increment count
- `fileChanges`: Add any created/modified files
- `notes.currentFocus`: What you're working on
- `notes.nextSteps`: What should be done next

### Step 6: Monitor Context Usage

**Critical**: Track your token usage throughout the session.

- At **60% context used** (120k tokens): Start wrapping up current task
- At **65% context used** (130k tokens): Stop taking on new tasks
- At **70% context used** (140k tokens): Begin handoff preparation

### Step 7: Prepare Handoff (When Context Reaches 70%)

When you reach 70% context usage:

1. **Complete current task** if close to done, otherwise mark as `"in_progress"`
2. **Update progress.json** with detailed notes:

```json
{
  "notes": {
    "currentFocus": "Working on Phase 1, Task 3 - layout-manager.js partially complete",
    "blockers": [
      "Need to test responsive breakpoints on actual Pi screen"
    ],
    "decisions": [
      "Chose CSS Grid over Flexbox for better 2D layout control",
      "Using clamp() for fluid typography instead of media query steps"
    ],
    "nextSteps": [
      "Complete layout-manager.js screen size detection",
      "Test on 7-inch Pi screen",
      "Move to panel-registry.js creation"
    ]
  }
}
```

3. **Add session to history**:

```json
{
  "sessionHistory": [
    {
      "session": 1,
      "timestamp": "2025-11-14T10:30:00Z",
      "contextUsed": 70,
      "description": "Completed responsive CSS and started layout-manager.js",
      "tasksCompleted": ["p1-t1", "p1-t2"]
    }
  ]
}
```

4. **Write final message to user** summarizing what was accomplished

---

## Project Phases Overview

### Phase 1: Foundation (Current Priority)
**Goal**: Establish responsive architecture and configuration system

**Key Deliverables**:
- `css/responsive.css` - Mobile-first responsive grid
- `js/layout-manager.js` - Screen size detection and layout application
- `js/panels/panel-registry.js` - Panel definitions
- `config/panels.json` - Panel configuration storage

**Success Criteria**: Layout adapts from 4" to 27" screens, panels can be registered

---

### Phase 2: New Panels
**Goal**: Add Timer/Alarm and Music Player panels

**Key Deliverables**:
- `js/panels/timer-panel.js` - Countdown timers and alarms
- `js/panels/music-panel.js` - Spotify integration
- Updated `system-monitor.js` - Spotify OAuth endpoints

**Success Criteria**: Timer works with audio alerts, Spotify can play music

---

### Phase 3: Themes
**Goal**: Extract current theme and add two new themes

**Key Deliverables**:
- `css/themes/cyberpunk.css` - Current theme extracted
- `css/themes/hiphop.css` - New hip-hop theme
- `css/themes/california.css` - New California theme
- `js/theme-manager.js` - Theme switching logic

**Success Criteria**: Can switch between 3 themes seamlessly

---

### Phase 4: Settings UI
**Goal**: Create settings page for user customization

**Key Deliverables**:
- `settings.html` - Settings page UI
- `js/settings.js` - Settings logic
- Drag-and-drop layout editor
- Theme selector with previews

**Success Criteria**: Users can customize panels and themes through UI

---

### Phase 5: Install & Migration
**Goal**: Update installation and provide migration path

**Key Deliverables**:
- `scripts/migrate.js` - Config migration tool
- Updated `setup.sh` - Interactive installation
- Updated `README.md` - Documentation

**Success Criteria**: Fresh installs work, existing setups can migrate

---

## Important Context to Remember

### Current System State
- **Branch**: `feature/responsive-kiosk`
- **Current Layout**: Fixed 2x2 grid
- **Current Theme**: Cyberpunk (inline in style.css)
- **Current Panels**: Weather, Markets, News, Video, Cyberspace (hardcoded)
- **Screen**: 7-inch Raspberry Pi touchscreen (primary target)

### Key Files to Know
- `index.html` - Main kiosk page
- `css/style.css` - Current monolithic styles
- `js/app.js` - Main application logic
- `system-monitor.js` - Backend server (port 3001)
- `.env` - Environment configuration

### Technical Constraints
- **Target device**: Raspberry Pi with 7" touchscreen
- **Performance**: Keep animations smooth (60fps target)
- **Compatibility**: Must work without breaking existing features
- **Browser**: Chromium on Raspberry Pi OS

### Design Principles
1. **Mobile-first**: Design for smallest screen, enhance for larger
2. **Progressive enhancement**: Core functionality works everywhere
3. **Graceful degradation**: Advanced features fail gracefully
4. **Performance-conscious**: Pi has limited resources
5. **Accessibility**: Readable fonts, good contrast, touch-friendly

---

## Common Patterns & Best Practices

### File Organization
```
cyber-kiosk/
├── css/
│   ├── style.css           # Base styles
│   ├── responsive.css      # NEW: Responsive layouts
│   └── themes/             # NEW: Theme files
├── js/
│   ├── app.js              # Main app logic
│   ├── layout-manager.js   # NEW: Layout management
│   ├── theme-manager.js    # NEW: Theme management
│   └── panels/             # NEW: Panel modules
└── config/                 # NEW: Configuration files
```

### Task Dependency Rules
- **Never skip dependencies**: If task X depends on task Y, complete Y first
- **Mark blockers clearly**: If you can't complete a task, note why in `notes.blockers`
- **Update dependencies**: If you discover new dependencies, add them to the task

### Testing Guidelines
- **Test after each major change**: Don't accumulate untested changes
- **Use browser dev tools**: Chromium responsive mode for screen size testing
- **Check on actual device**: When possible, test on the 7" Pi screen
- **Cross-theme testing**: Test changes with all available themes

### Code Quality
- **Comment complex logic**: Explain why, not what
- **Use meaningful names**: Variables, functions, classes should be self-documenting
- **Keep functions small**: Single responsibility principle
- **Avoid breaking changes**: Maintain backward compatibility

---

## Emergency Procedures

### If You Get Stuck
1. **Document the blocker** in `notes.blockers`
2. **Mark task as in_progress** with detailed notes
3. **Move to a different task** that doesn't have the same blocker
4. **Leave clear notes** for next Claude session or user

### If Tests Fail
1. **Don't proceed** until issue is resolved
2. **Document the failure** in task notes
3. **Roll back if needed**: Use git to revert problematic changes
4. **Ask user for guidance**: Leave clear description of the issue

### If You're Unsure
1. **Check PROPOSAL_1_RESPONSIVE_KIOSK.md** for detailed specifications
2. **Look at existing code** for patterns and conventions
3. **Make conservative choices**: Favor simple, proven approaches
4. **Document your decision** in `notes.decisions`

---

## Context Management Strategy

### Token Budget
- **Total available**: 200,000 tokens
- **Work until**: 140,000 tokens used (70% context, 40% remaining)
- **Reserve**: 60,000 tokens for handoff and final updates

### Efficient Context Use
1. **Don't re-read entire proposal** unless necessary
2. **Focus on current phase** tasks only
3. **Read files only once** when possible
4. **Use grep/search** instead of reading entire files
5. **Keep progress.json updates concise**

### When to Stop
Stop working when you reach **140,000 tokens used** (70% context):
1. Complete or pause current task
2. Update progress.json comprehensively
3. Write handoff notes
4. Commit changes to git
5. Inform user of progress and next steps

---

## Git Workflow

### Commits
- **Commit after each completed task**: Don't batch too many changes
- **Use descriptive messages**: Reference task IDs (e.g., "Complete p1-t1: Create responsive.css")
- **Follow conventional commits**: `feat:`, `fix:`, `refactor:`, etc.

### Branches
- **Current branch**: `feature/responsive-kiosk`
- **Don't merge to main**: Stay on feature branch throughout development
- **Don't create new branches**: All work happens on this branch

---

## Success Checklist

Before ending your session, ensure:

- [ ] All completed tasks are marked `"completed"` in progress.json
- [ ] All in-progress tasks have detailed notes
- [ ] `fileChanges` arrays are updated
- [ ] `notes.nextSteps` is clear and actionable
- [ ] Session history is updated
- [ ] Context usage percentage is recorded
- [ ] Changes are committed to git
- [ ] User is informed of progress

---

## Quick Reference

### Update Progress JSON (Completed Task)
```json
{
  "id": "p1-t1",
  "status": "completed",
  "notes": "Brief description of what was done and any gotchas"
}
```

### Update Progress JSON (Session End)
```json
{
  "lastUpdated": "2025-11-14T10:30:00Z",
  "contextUsedPercent": 70,
  "currentPhase": "Phase 1: Foundation",
  "overallProgress": {
    "completedTasks": 3,
    "totalTasks": 44
  },
  "notes": {
    "currentFocus": "What you were working on",
    "nextSteps": ["What should happen next", "And next after that"]
  },
  "sessionHistory": [
    {
      "session": 1,
      "timestamp": "2025-11-14T10:30:00Z",
      "contextUsed": 70,
      "description": "Summary of session",
      "tasksCompleted": ["p1-t1", "p1-t2"]
    }
  ]
}
```

---

## Questions?

If anything is unclear:
1. Check `PROPOSAL_1_RESPONSIVE_KIOSK.md` for detailed specs
2. Look at existing code for patterns
3. Ask the user for clarification
4. Document your question in `notes.blockers` for the user to address

---

## Let's Build Something Amazing!

This is a well-planned, incremental approach to transforming the cyber-kiosk. Take your time, test thoroughly, and leave clear notes for the next session. Good luck!

---

**Current Status**: Ready to begin Phase 1: Foundation
**Next Task**: Start with `p1-t1` - Create `css/responsive.css` with mobile-first breakpoints
