const ALLOWED_EVENTS = new Set([
  "smart_input_used",
  "smart_detect_json",
  "smart_detect_messy_json",
  "smart_detect_base64",
  "smart_detect_url_encoded",
  "smart_detect_timestamp_seconds",
  "smart_detect_timestamp_ms",
  "smart_detect_list",
  "smart_detect_text",
  "smart_action_json",
  "smart_action_base64",
  "smart_action_url",
  "smart_action_timestamp",
  "smart_action_clean_text",
  "smart_action_dedupe",
  "smart_action_sort",
  "smart_action_word_count",
  "smart_action_case_converter",
  "tool_input_used",
  "tool_action_clicked",
  "tool_result_created",
  "pro_page_viewed",
  "pro_files_selected",
  "checkout_ready",
  "checkout_started",
  "checkout_failed",
  "checkout_completed",
  "share_clicked",
  "share_completed",
  "install_prompt_shown",
  "install_clicked",
  "install_completed",
  "copy_used"
]);

function cleanPage(value) {
  if (typeof value !== "string") return "/";
  const page = value.split("?")[0].slice(0, 120);
  return /^\/[a-z0-9/_-]*$/i.test(page) ? page : "/";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const event = req.body && typeof req.body.event === "string" ? req.body.event : null;
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return res.status(400).end();
  }

  const page = cleanPage(req.body && req.body.page);
  console.log(JSON.stringify({
    level: "info",
    message: "quicktiny_event",
    event,
    page,
    timestamp: new Date().toISOString()
  }));
  return res.status(204).end();
}
