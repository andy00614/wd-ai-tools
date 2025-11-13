-- AI Models Seed Data
-- 清空现有数据
DELETE FROM ai_models;

-- OpenAI Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at) VALUES
('openai-gpt4o', 'openai', 'gpt-4o', 'GPT-4 Omni', 2.5, 10.0, 1, unixepoch(), unixepoch()),
('openai-gpt5', 'openai', 'gpt-5', 'GPT-5', 5.0, 15.0, 1, unixepoch(), unixepoch()),
('openai-gpt41mini', 'openai', 'gpt-4.1-mini', 'GPT-4.1 Mini', 0.15, 0.6, 1, unixepoch(), unixepoch());

-- Google Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at) VALUES
('google-gemini25flash', 'google', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 0.075, 0.3, 1, unixepoch(), unixepoch());

-- Anthropic Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at) VALUES
('anthropic-haiku45', 'anthropic', 'claude-haiku-4.5', 'Claude Haiku 4.5', 0.8, 4.0, 1, unixepoch(), unixepoch()),
('anthropic-sonnet45', 'anthropic', 'claude-sonnet-4.5', 'Claude Sonnet 4.5', 3.0, 15.0, 1, unixepoch(), unixepoch());

-- Azure Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at) VALUES
('azure-gpt4o', 'azure', 'gpt-4o', 'Azure GPT-4 Omni', 2.5, 10.0, 1, unixepoch(), unixepoch()),
('azure-gpt5', 'azure', 'gpt-5', 'Azure GPT-5', 5.0, 15.0, 1, unixepoch(), unixepoch()),
('azure-gpt41mini', 'azure', 'gpt-4.1-mini', 'Azure GPT-4.1 Mini', 0.15, 0.6, 1, unixepoch(), unixepoch());

-- Groq Models
INSERT INTO ai_models (id, provider, model_id, display_name, input_price_per_million, output_price_per_million, is_active, created_at, updated_at) VALUES
('groq-qwen332b', 'groq', 'qwen-3-32b', 'Qwen 3 32B', 0.1, 0.1, 1, unixepoch(), unixepoch());

-- 验证数据
SELECT COUNT(*) as total_models FROM ai_models;
SELECT provider, COUNT(*) as count FROM ai_models GROUP BY provider;
