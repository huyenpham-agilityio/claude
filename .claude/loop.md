# Maintenance loop for the open merge request

Run on every tick. Keep each run short and read-only.

1. **Find the open MR** for the current branch on GitLab
   (`gitlab.asoft-python.com/huyen.pham/claude`). Use the signed-in browser if
   `glab` is not logged in. If there is no open MR, say so and stop.
2. **Check what changed** since the last tick:
   - pipeline or CI status
   - new review comments or unresolved threads
   - merge conflicts with the target branch (`feat/practice`)
   - new commits on the target branch
3. **Report only changes.** One short line per change. If nothing changed,
   reply "No change" and stop. Do not repeat what was reported before.
4. **Never act without asking.** Do not commit, push, merge, resolve threads,
   post comments or edit the MR. Suggest the next step and wait.
