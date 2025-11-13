-- Fix GPT-4o display name from "GPT-4 Omni" to "GPT-4o"
UPDATE ai_models
SET display_name = 'GPT-4o', updated_at = unixepoch()
WHERE provider = 'openai' AND model_id = 'gpt-4o';

UPDATE ai_models
SET display_name = 'Azure GPT-4o', updated_at = unixepoch()
WHERE provider = 'azure' AND model_id = 'gpt-4o';
