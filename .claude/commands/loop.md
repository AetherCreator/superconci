# /loop — Autonomous Continuation
Continue working until the task is fully complete without waiting for input.

Usage: append /loop to any request
Example: "build the recipe card component /loop"

What to do:
1. Complete the full task end to end
2. Handle errors by attempting fixes (max 3 retries per error)
3. Only stop when: task is complete, OR stuck after 3 retries on same error
4. On completion: summarize what was built
5. On stuck: write exactly what failed and what is needed to continue
