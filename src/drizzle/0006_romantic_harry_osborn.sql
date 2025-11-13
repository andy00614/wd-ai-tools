-- Remove duplicate ai_models before creating unique index
-- Keep only the first occurrence of each (provider, model_id) pair
DELETE FROM ai_models
WHERE id NOT IN (
  SELECT MIN(id)
  FROM ai_models
  GROUP BY provider, model_id
);

-- Now create the unique index
CREATE UNIQUE INDEX `ai_models_provider_model_id_unique` ON `ai_models` (`provider`,`model_id`);