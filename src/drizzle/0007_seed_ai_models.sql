-- Seed default AI models (idempotent - uses unique constraint on provider + model_id)

-- OpenAI Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at)
VALUES
  ('openai-gpt-4o', 'openai', 'gpt-4o', 'GPT-4o', 2.5, 10.0, 1, unixepoch(), unixepoch()),
  ('openai-gpt-5', 'openai', 'gpt-5', 'GPT-5', 5.0, 15.0, 1, unixepoch(), unixepoch()),
  ('openai-gpt-4.1-mini', 'openai', 'gpt-4.1-mini', 'GPT-4.1 Mini', 0.15, 0.6, 1, unixepoch(), unixepoch())
ON CONFLICT(provider, model_id) DO UPDATE SET
  display_name = excluded.display_name,
  input_price_per_million = excluded.input_price_per_million,
  output_price_per_million = excluded.output_price_per_million,
  updated_at = unixepoch();

-- Google Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at)
VALUES
  ('google-gemini-2.5-flash', 'google', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 0.075, 0.3, 1, unixepoch(), unixepoch())
ON CONFLICT(provider, model_id) DO UPDATE SET
  display_name = excluded.display_name,
  input_price_per_million = excluded.input_price_per_million,
  output_price_per_million = excluded.output_price_per_million,
  updated_at = unixepoch();

-- Anthropic Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at)
VALUES
  ('anthropic-claude-haiku-4.5', 'anthropic', 'claude-haiku-4.5', 'Claude Haiku 4.5', 0.8, 4.0, 1, unixepoch(), unixepoch()),
  ('anthropic-claude-sonnet-4.5', 'anthropic', 'claude-sonnet-4.5', 'Claude Sonnet 4.5', 3.0, 15.0, 1, unixepoch(), unixepoch())
ON CONFLICT(provider, model_id) DO UPDATE SET
  display_name = excluded.display_name,
  input_price_per_million = excluded.input_price_per_million,
  output_price_per_million = excluded.output_price_per_million,
  updated_at = unixepoch();

-- Azure Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at)
VALUES
  ('azure-gpt-4o', 'azure', 'gpt-4o', 'Azure GPT-4o', 2.5, 10.0, 1, unixepoch(), unixepoch()),
  ('azure-gpt-5', 'azure', 'gpt-5', 'Azure GPT-5', 5.0, 15.0, 1, unixepoch(), unixepoch()),
  ('azure-gpt-4.1-mini', 'azure', 'gpt-4.1-mini', 'Azure GPT-4.1 Mini', 0.15, 0.6, 1, unixepoch(), unixepoch())
ON CONFLICT(provider, model_id) DO UPDATE SET
  display_name = excluded.display_name,
  input_price_per_million = excluded.input_price_per_million,
  output_price_per_million = excluded.output_price_per_million,
  updated_at = unixepoch();

-- Groq Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at)
VALUES
  ('groq-qwen-3-32b', 'groq', 'qwen-3-32b', 'Qwen 3 32B', 0.1, 0.1, 1, unixepoch(), unixepoch())
ON CONFLICT(provider, model_id) DO UPDATE SET
  display_name = excluded.display_name,
  input_price_per_million = excluded.input_price_per_million,
  output_price_per_million = excluded.output_price_per_million,
  updated_at = unixepoch();
