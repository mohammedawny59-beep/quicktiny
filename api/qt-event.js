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
  "smart_action_case_converter"
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const event = req.body && typeof req.body.event === "string" ? req.body.event : null;

  if (!event || !ALLOWED_EVENTS.has(event)) {
    return res.status(400).end();
  }

  console.log("[QT_EVENT]", event);
  return res.status(204).end();
}
