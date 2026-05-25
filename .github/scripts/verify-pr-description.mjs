import { readFileSync } from 'fs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.log("⚠️ GITHUB_EVENT_PATH is not defined. Skipping PR description check (probably running locally or in non-PR context).");
  process.exit(0);
}

try {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const prBody = event.pull_request?.body || "";

  // Regex matches "- [x] Product", "- [X] Developer", with optional whitespace variations
  const hasRoleChecked = /-\s*\[[xX]\]\s*(Product|Developer)/.test(prBody);

  if (hasRoleChecked) {
    console.log("✅ Verified: At least one role (Product or Developer) is selected in the PR description.");
    process.exit(0);
  } else {
    console.error("❌ Error: You must select at least one role (Product or Developer) in the PR description!");
    console.error("Please edit the pull request description to check at least one role (e.g. check '- [x] Product' or '- [x] Developer').");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Failed to parse GitHub event payload or verify PR description:", error);
  process.exit(1);
}
