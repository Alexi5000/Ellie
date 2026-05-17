# Legacy CI Compatibility Bridge

This directory exists because the repository's currently protected GitHub Actions workflows still reference split `backend/` and `frontend/` workspaces. The production application is built from the repository root with pnpm and the root Dockerfile. These files delegate validation back to the root application until workflow-write permission is available to replace the legacy workflows.
