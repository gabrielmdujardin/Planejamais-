import { execSync } from "child_process"

try {
  const result = execSync("npx vitest run --reporter=verbose 2>&1", {
    cwd: "/vercel/share/v0-project",
    timeout: 60000,
    encoding: "utf8",
  })
  console.log(result)
} catch (error) {
  console.log("Exit code:", error.status)
  console.log("Output:", error.stdout)
  console.log("Stderr:", error.stderr)
}
