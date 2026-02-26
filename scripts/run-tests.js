const { execSync } = require("child_process")

try {
  const result = execSync("npx vitest run --reporter=verbose", {
    cwd: "/vercel/share/v0-project",
    timeout: 120000,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 10 * 1024 * 1024,
  })
  console.log("STDOUT:", result)
} catch (error) {
  if (error.stdout) console.log("STDOUT:\n", error.stdout)
  if (error.stderr) console.log("STDERR:\n", error.stderr)
  if (error.status !== null) console.log("Exit code:", error.status)
  if (!error.stdout && !error.stderr) {
    console.log("Error message:", error.message)
  }
}
