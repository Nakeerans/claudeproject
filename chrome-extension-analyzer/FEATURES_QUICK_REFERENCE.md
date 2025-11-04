# Quick Feature Reference: Huntr vs Simplify Copilot

## ⚡ At a Glance

| Feature | Huntr | Simplify |
|---------|-------|----------|
| Job Tracking | ✅ | ✅ |
| Autofill | ✅ | ✅ Advanced |
| One-Click Apply | ✅ | ✅ |
| Resume Upload | ✅ | ✅ |
| ATS Support | Good | Excellent (100+) |
| Remote Config | ❌ | ✅ 1.7MB |
| Context Menu | ❌ | ✅ |
| Offscreen Docs | ❌ | ✅ |
| Code Splitting | ❌ | ✅ |
| Web Requests | ❌ | ✅ |
| Cookies | ❌ | ✅ |
| AI Features | ❌ | ✅ |
| Map View | ✅ | ❌ |
| jQuery | ✅ | ❌ |
| Size | 4.8MB | 8.2MB |

## 🎯 Core Features (Both)

### Job Tracking
- Save jobs from any website
- Track application status
- Organize by company/location
- Cloud sync

### Autofill
- Personal info (name, email, phone)
- Work history
- Education
- EEO questions
- Resume/Cover letter upload

### Detection
- Automatic job board recognition
- Form field identification
- Success confirmation

## 🌟 Unique to Simplify

1. **100+ ATS platforms** (vs Huntr's ~20)
2. **Remote configuration** (no extension updates needed)
3. **Offscreen documents** (background DOM processing)
4. **Context menus** (right-click shortcuts)
5. **Web request monitoring** (auto-detect submissions)
6. **Cookie management** (auto-authentication)
7. **Code splitting** (better performance)
8. **AI features** (resume generation, job matching)

## 🌟 Unique to Huntr

1. **Map visualization** (Google Maps integration)
2. **Activity timeline** (visual history)
3. **jQuery-based** (stable, mature)
4. **Smaller background worker** (89KB vs 2.3MB)

## 📊 Supported ATS Platforms

### Both Support:
- LinkedIn
- Indeed
- Greenhouse
- Lever
- Workday
- iCIMS
- Taleo
- BambooHR
- SmartRecruiters

### Simplify Also Supports:
- 90+ additional platforms
- Custom company ATSs
- Regional job boards
- International platforms

## 🔐 Permissions

### Huntr (6):
- alarms
- storage
- tabs
- webNavigation
- scripting
- unlimitedStorage

### Simplify (10):
All of Huntr's plus:
- activeTab
- **cookies** ⭐
- **contextMenus** ⭐
- **offscreen** ⭐
- **webRequest** ⭐

## 💻 Technical Stack

### Huntr
- jQuery 3.2.1 + jQuery UI
- Service Worker
- Traditional bundling

### Simplify
- Vanilla JavaScript
- Service Worker
- Code splitting
- Remote config
- Offscreen documents

## 🎓 Learning Value

**Study Huntr to learn:**
- jQuery patterns
- Traditional extension architecture
- Job parsing algorithms
- Map integrations

**Study Simplify to learn:**
- Modern MV3 features
- Code splitting
- Remote configuration
- Web request interception
- Offscreen documents
- Production-scale architecture

## 🚀 Performance

| Metric | Huntr | Simplify |
|--------|-------|----------|
| Initial Load | Slow | Fast* |
| Memory | Lower | Higher |
| Flexibility | Lower | Higher |
| Updates | Extension | Remote |

*Due to code splitting

## 📈 Best For

### Huntr
- Comprehensive job tracking
- Visual organization
- Map-based job search
- Stable, mature platform

### Simplify
- High-volume applications
- Speed and automation
- Latest tech features
- Diverse ATS platforms

## 📚 Full Analysis

See **CONSOLIDATED_FEATURES_LIST.md** for:
- Detailed feature breakdown
- Code examples
- Architecture diagrams
- Implementation details
- Use case recommendations

---

**Quick Tip:** Both extensions are excellent for learning. Start with Huntr for basics, then study Simplify for advanced patterns!
