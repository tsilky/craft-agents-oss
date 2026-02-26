/**
 * Session Tools Core - Handlers
 *
 * Exports all handler functions for session-scoped tools.
 * These handlers are used by both Claude and Codex implementations.
 */

// SubmitPlan
export { handleSubmitPlan } from './submit-plan.ts';
export type { SubmitPlanArgs } from './submit-plan.ts';

// Config Validate
export { handleConfigValidate } from './config-validate.ts';
export type { ConfigValidateArgs } from './config-validate.ts';

// Skill Validate
export { handleSkillValidate } from './skill-validate.ts';
export type { SkillValidateArgs } from './skill-validate.ts';

// Mermaid Validate
export { handleMermaidValidate } from './mermaid-validate.ts';
export type { MermaidValidateArgs } from './mermaid-validate.ts';

// Source Test
export { handleSourceTest } from './source-test.ts';
export type { SourceTestArgs } from './source-test.ts';

// OAuth Triggers
export {
  handleSourceOAuthTrigger,
  handleGoogleOAuthTrigger,
  handleSlackOAuthTrigger,
  handleMicrosoftOAuthTrigger,
} from './source-oauth.ts';
export type {
  SourceOAuthTriggerArgs,
  GoogleOAuthTriggerArgs,
  SlackOAuthTriggerArgs,
  MicrosoftOAuthTriggerArgs,
} from './source-oauth.ts';

// Credential Prompt
export { handleCredentialPrompt } from './credential-prompt.ts';
export type { CredentialPromptArgs } from './credential-prompt.ts';

// Orchestration (Super Sessions)
export { handleSpawnChild } from './spawn-child.ts';
export type { SpawnChildArgs, SpawnChildResult } from './spawn-child.ts';

export { handleWaitForChildren } from './wait-children.ts';
export type { WaitForChildrenArgs } from './wait-children.ts';

export { handleGetChildResult } from './get-child-result.ts';
export type { GetChildResultArgs, ChildResultResponse } from './get-child-result.ts';

export { handleReviewChildPlan } from './review-child-plan.ts';
export type { ReviewChildPlanArgs, ReviewChildPlanResult } from './review-child-plan.ts';

export { handleListChildren } from './list-children.ts';
export type { ListChildrenArgs, ChildSummary, ListChildrenResponse } from './list-children.ts';
