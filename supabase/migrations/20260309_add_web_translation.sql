-- Add World English Bible (WEB) as a supported translation
-- The WEB is a public domain modern English translation

-- Drop existing check constraint and add updated one that includes 'web'
ALTER TABLE verses DROP CONSTRAINT IF EXISTS verses_translation_check;
ALTER TABLE verses ADD CONSTRAINT verses_translation_check CHECK (translation IN ('kjv', 'ct', 'web'));
