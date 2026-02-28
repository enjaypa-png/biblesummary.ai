/**
 * Phase 3: AUTO_CORRECT_FAILED_VERSES
 *
 * Correction Agent: fix ONLY the audit violation described.
 * Uses same rewrite constraints (ZERO SEMANTIC SHIFT) as Phase 1.
 * Real-time API — no batch.
 *
 * Called by ct-audit-batch-phase2-download when a verse fails Phase 2 audit.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 512;

const PHASE3_CORRECTION_SYSTEM = `You are the Correction Agent.

HARD RULE — ZERO SEMANTIC SHIFT:
The correction may ONLY fix the specific violation described.
It may NOT:
- add emphasis
- add clarification
- add implied causation
- intensify tone
- soften tone
- broaden meaning
- narrow meaning
- replace a word with a stronger synonym
- replace a word with a broader synonym
- replace a word with a more interpretive synonym
- add words not present in the KJV unless required for modern grammar

Do NOT perform a fresh rewrite. Fix ONLY the violation described in the audit reason.
Make the minimum change necessary to address the failure.

Allowed modernizations (when fixing):
- doth → does
- hath → has
- ye → you
- unto → to
- thereof → of it

The corrected CT must remain restrained and literal.
Preserve semantic range. Do not upgrade or intensify language.
Do not change anything beyond what is required to fix the described violation.

Output ONLY the corrected CT verse text. No commentary. No explanation.`;

const AUDIT_SYSTEM = `You are the Audit Agent. Evaluate strict semantic equivalence between the KJV verse and the modernized verse.

You must NOT rewrite. Only evaluate.

Output EXACTLY one of:
PASS
or
FAIL
Reason: (one sentence max)

Fail if the modernized verse: adds meaning, removes meaning, alters tone, changes emotional intensity, or introduces implication not present in the KJV.`;

function buildCorrectionUserPrompt(kjv: string, failedCt: string, auditReason: string): string {
  return `KJV: ${kjv}

Failed CT: ${failedCt}

Audit failure reason: ${auditReason}

Fix ONLY the violation described. Do not rewrite. Output corrected CT text only:`;
}

function buildAuditUserPrompt(kjv: string, modernized: string): string {
  return `KJV: ${kjv}

Modernized: ${modernized}

PASS or FAIL?`;
}

function parseAuditResponse(raw: string): { pass: boolean; reason?: string } {
  const text = raw.trim().toUpperCase();
  if (text.startsWith('PASS')) {
    return { pass: true };
  }
  if (text.startsWith('FAIL')) {
    const reasonMatch = raw.match(/Reason:\s*(.+?)(?:\n|$)/i);
    return { pass: false, reason: reasonMatch?.[1]?.trim() ?? 'No reason given' };
  }
  return { pass: false, reason: raw.slice(0, 100) };
}

export async function callPhase3Correction(
  kjv: string,
  failedCt: string,
  auditReason: string
): Promise<string> {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.2,
    system: PHASE3_CORRECTION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: buildCorrectionUserPrompt(kjv, failedCt, auditReason)
      }
    ]
  });
  const block = resp.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text in Phase 3 correction response');
  return block.text.trim();
}

export async function callPhase3Audit(
  kjv: string,
  modernized: string
): Promise<{ pass: boolean; reason?: string }> {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: AUDIT_SYSTEM,
    messages: [{ role: 'user', content: buildAuditUserPrompt(kjv, modernized) }]
  });
  const block = resp.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text in Phase 3 audit response');
  return parseAuditResponse(block.text);
}

export interface Phase3Result {
  corrected: string;
  pass: boolean;
  reason?: string;
}

/**
 * Run Phase 3 correction + re-audit for a single failed verse.
 * Returns corrected CT and whether it passes re-audit.
 */
export async function runPhase3(
  kjv: string,
  failedCt: string,
  auditReason: string
): Promise<Phase3Result> {
  const corrected = await callPhase3Correction(kjv, failedCt, auditReason);
  const { pass, reason } = await callPhase3Audit(kjv, corrected);
  return { corrected, pass, reason };
}
