# Claude Code Context Files

This directory contains context files designed to minimize token usage and speed up Claude Code sessions.

## Files

### `PROJECT-CONTEXT.md` (Primary Context File)
Complete project context including:
- Project overview and goals
- Tech stack and architecture
- File structure and key locations
- Database schema
- API endpoints
- Current state and next steps
- Common issues and solutions
- Code patterns and conventions

**Size**: ~8,000 tokens (vs ~50,000+ tokens of reading all files)

**Savings**: 70-85% token reduction per session start

## How to Use in New Sessions

### Quick Start (Recommended)
Start your new Claude Code session with:

```
I'm continuing work on the Huntr.co clone project.
Please read .claude/PROJECT-CONTEXT.md for complete context.
```

Then add your specific task:
```
I need help implementing [specific feature].
```

### Task-Specific Start
For working on a specific feature:

```
Continuing Huntr.co clone. Read .claude/PROJECT-CONTEXT.md.
I need help with: Resume upload feature
Key files: src/server/routes/resumes.js, src/server/controllers/resumeController.js
```

### Analysis-Heavy Tasks
When you need detailed UI/UX information:

```
Read .claude/PROJECT-CONTEXT.md for project context.
Also review huntr-ai-guided-analysis/elements-database.json
to understand Huntr.co's [specific component] for implementing [feature].
```

## Updating Context Files

### When to Update
- ✅ After implementing major features
- ✅ After architectural decisions
- ✅ After running the analyzer with new data
- ✅ Weekly during active development
- ✅ Before ending a session if significant work was done

### What to Update in PROJECT-CONTEXT.md
1. **Section 8** - Current state & next steps
2. **Section 7** - Recent commits
3. **Section 5** - Features (mark ✅ or ⏳)
4. **Section 9** - Any new issues/solutions discovered
5. **Section 11** - New dependencies or patterns

### How to Update
```bash
# Edit the context file
nano .claude/PROJECT-CONTEXT.md

# Or use your preferred editor
code .claude/PROJECT-CONTEXT.md

# Commit the updates
git add .claude/PROJECT-CONTEXT.md
git commit -m "Update project context: [what changed]"
```

## Best Practices

### For Ending Sessions
Before ending a Claude Code session, consider updating PROJECT-CONTEXT.md with:
- What was accomplished
- What's next (update Section 8)
- Any new issues encountered (Section 9)
- New files created (Section 10)

### For Starting Sessions
1. **Always reference the context file** in your first message
2. **Be specific** about what you want to work on
3. **Reference section numbers** when relevant (e.g., "See Section 5 for feature list")
4. **Check git log** for any changes since context was updated:
   ```bash
   git log --oneline -5
   ```

### For Long-Running Tasks
If working on a feature across multiple sessions:
1. Update PROJECT-CONTEXT.md at end of each session
2. Note current progress in Section 8
3. List any blockers or decisions needed
4. In next session, reference previous work directly

## Token Savings Examples

### Without Context File
```
You: "I need help with this project"
Claude: *Reads 15-20 files*
Claude: *Analyzes git history*
Claude: *Reads package.json, schema.prisma, etc.*
Total: ~50,000-80,000 tokens
```

### With Context File
```
You: "Read .claude/PROJECT-CONTEXT.md. I need help with resume upload."
Claude: *Reads PROJECT-CONTEXT.md*
Claude: *Reads only relevant files*
Total: ~10,000-15,000 tokens
```

**Savings**: 70-85% reduction in initial context loading

## Advanced Usage

### Combining with Specific Files
```
Read .claude/PROJECT-CONTEXT.md for overall context.
Then review these specific files:
- huntr-ai-guided-analysis/elements-database.json (for UI structure)
- prisma/schema.prisma (for database models)
- src/server/routes/resumes.js (for current implementation)

I want to add [specific feature].
```

### For Debugging
```
Read .claude/PROJECT-CONTEXT.md.
I'm getting an error in [specific file].
See Section 9 for common issues - this might be related to [issue].
```

### For Architecture Decisions
```
Read .claude/PROJECT-CONTEXT.md.
See Section 11 for our current design decisions.
I need to decide whether to [option A] or [option B] for [feature].
```

## Maintenance Schedule

### Daily (During Active Development)
- ✅ Note completed tasks in Section 8
- ✅ Update "What's Next" list

### Weekly
- ✅ Review and update all sections
- ✅ Clean up completed items
- ✅ Update commit history (Section 7)
- ✅ Document new patterns (Section 11)

### After Major Milestones
- ✅ Comprehensive review of entire file
- ✅ Update tech stack if changed
- ✅ Reorganize sections if needed
- ✅ Archive old information

## File Management

### This Directory Should Contain
- ✅ PROJECT-CONTEXT.md (main context)
- ✅ README.md (this file)
- ❌ No temporary files
- ❌ No generated files
- ❌ No credentials/secrets

### Git Tracking
- ✅ Commit context files to git
- ✅ Track updates in commit messages
- ❌ Don't include sensitive information
- ❌ Don't include large generated data

## Tips for Maximum Efficiency

1. **First Message Matters**: Always include context file reference in your first message to Claude
2. **Be Specific**: The more specific your task, the fewer files Claude needs to read
3. **Update Regularly**: Keep context fresh to maintain accuracy
4. **Use Sections**: Reference specific sections to guide Claude's attention
5. **Combine with Git Log**: If context is slightly outdated, mention to check recent commits
6. **Keep It Current**: Outdated context is worse than no context

## Example Session Starts

### ✅ Good Session Start
```
I'm continuing work on the Huntr.co clone project.
Read .claude/PROJECT-CONTEXT.md for complete context.

I need to implement the resume upload feature (see Section 8, item 2).
Key files are listed in Section 10.
I've already set up AWS S3 credentials.

Let's start with the backend API endpoint.
```

**Why it's good:**
- References context file immediately
- Specific about the task
- Points to relevant sections
- Provides current state information
- Has a clear starting point

### ❌ Poor Session Start
```
Help me with the project
```

**Why it's poor:**
- No context reference
- Vague task description
- Claude must read many files
- Wastes 40,000+ tokens
- Takes longer to get started

## Support

If you have questions about this context system:
1. Check this README
2. Review PROJECT-CONTEXT.md structure
3. Look at example session starts above
4. Update files as you learn what works best

---

**Remember**: The goal is to give Claude complete context in minimal tokens, allowing faster, more accurate assistance with less cost.
