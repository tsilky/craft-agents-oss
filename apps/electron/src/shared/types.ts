// =============================================================================
// Protocol re-exports (channels, DTOs, events, wire types)
// =============================================================================
export * from '@craft-agent/shared/protocol'

// =============================================================================
// Package re-exports (convenience for renderer imports)
// =============================================================================

// Core types
import type {
  Message as CoreMessage,
  MessageRole as CoreMessageRole,
  TypedError,
  TokenUsage as CoreTokenUsage,
  Workspace as CoreWorkspace,
  SessionMetadata as CoreSessionMetadata,
  StoredAttachment as CoreStoredAttachment,
  ContentBadge,
  ToolDisplayMeta,
  AnnotationV1,
} from '@craft-agent/core/types';

// Mode types from dedicated subpath export (avoids pulling in SDK)
import type { PermissionMode } from '@craft-agent/shared/agent/modes';
export type { PermissionMode };
export { PERMISSION_MODE_CONFIG } from '@craft-agent/shared/agent/modes';

// Thinking level types
import type { ThinkingLevel } from '@craft-agent/shared/agent/thinking-levels';
export type { ThinkingLevel };
export { THINKING_LEVELS, DEFAULT_THINKING_LEVEL } from '@craft-agent/shared/agent/thinking-levels';

export type {
  CoreMessage as Message,
  CoreMessageRole as MessageRole,
  TypedError,
  CoreTokenUsage as TokenUsage,
  CoreWorkspace as Workspace,
  CoreSessionMetadata as SessionMetadata,
  CoreStoredAttachment as StoredAttachment,
  ContentBadge,
  ToolDisplayMeta,
  AnnotationV1,
};

// Auth types for onboarding
import type { AuthState, SetupNeeds } from '@craft-agent/shared/auth/types';
import type { AuthType } from '@craft-agent/shared/config/types';
export type { AuthState, SetupNeeds, AuthType };

// Credential health types
import type { CredentialHealthStatus, CredentialHealthIssue, CredentialHealthIssueType } from '@craft-agent/shared/credentials/types';
export type { CredentialHealthStatus, CredentialHealthIssue, CredentialHealthIssueType };

// Source types for session source selection
import type { LoadedSource, FolderSourceConfig, SourceConnectionStatus } from '@craft-agent/shared/sources/types';
export type { LoadedSource, FolderSourceConfig, SourceConnectionStatus };

// Skill types
import type { LoadedSkill, SkillMetadata } from '@craft-agent/shared/skills/types';
export type { LoadedSkill, SkillMetadata };

// Import project types
import type { ProjectSummary } from '@craft-agent/shared/projects/types';
export type { ProjectSummary };

// Import session types from shared (for SessionFamily - different from core SessionMetadata)
import type { SessionMetadata as SharedSessionMetadata } from '@craft-agent/shared/sessions/types';

// LLM connection types
import type { LlmConnection, LlmConnectionWithStatus, LlmAuthType, LlmProviderType, NetworkProxySettings } from '@craft-agent/shared/config';
export type { LlmConnection, LlmConnectionWithStatus, LlmAuthType, LlmProviderType, NetworkProxySettings };

// =============================================================================
// Fork-specific types (not in @craft-agent/shared/protocol)
// =============================================================================

/**
 * Summary of a hook matcher for the Hooks settings page
 */
export interface HookMatcherSummary {
  matcher?: string
  cron?: string
  timezone?: string
  enabled?: boolean
  permissionMode?: string
  labels?: string[]
  hooks: Array<{ type: 'command' | 'prompt'; summary: string }>
}

/**
 * Summary of hooks for a specific event
 */
export interface HookEventSummary {
  event: string
  matcherCount: number
  hookCount: number
  types: ('command' | 'prompt')[]
  matchers: HookMatcherSummary[]
}

/**
 * Result of listing hooks for a workspace
 */
export interface HooksListResult {
  hooks: HookEventSummary[]
  hasConfig: boolean
  filePath: string
}

/**
 * Result of listing projects for a workspace
 */
export interface ProjectListResult {
  projects: ProjectSummary[]
  /** Path to projects directory (for EditPopover) */
  filePath: string
}

/**
 * Result of loading a single project with context files
 */
export interface ProjectDetailResult {
  config: import('@craft-agent/shared/projects').ProjectConfig
  /** Content of CLAUDE.md if found in the project directory */
  claudeMd?: string
  /** Content of AGENTS.md if found in the project directory */
  agentsMd?: string
  /** Path to the project config.json (for EditPopover) */
  configPath: string
}

// =============================================================================
// GUI-only types (not used by server/handler code)
// =============================================================================

/**
 * Session family information (parent + siblings)
 * Uses SharedSessionMetadata from @craft-agent/shared (not core SessionMetadata)
 */
export interface SessionFamily {
  parent: SharedSessionMetadata
  siblings: SharedSessionMetadata[]
  self: SharedSessionMetadata
}

// IPC channel names
export const IPC_CHANNELS = {
  // Session management
  GET_SESSIONS: 'sessions:get',
  GET_UNREAD_SUMMARY: 'sessions:getUnreadSummary',
  MARK_ALL_SESSIONS_READ: 'sessions:markAllRead',
  SESSIONS_UNREAD_SUMMARY_CHANGED: 'sessions:unreadSummaryChanged',  // Broadcast: UnreadSummary
  CREATE_SESSION: 'sessions:create',
  DELETE_SESSION: 'sessions:delete',
  GET_SESSION_MESSAGES: 'sessions:getMessages',
  SEND_MESSAGE: 'sessions:sendMessage',
  CANCEL_PROCESSING: 'sessions:cancel',
  KILL_SHELL: 'sessions:killShell',
  GET_TASK_OUTPUT: 'tasks:getOutput',
  RESPOND_TO_PERMISSION: 'sessions:respondToPermission',
  RESPOND_TO_CREDENTIAL: 'sessions:respondToCredential',

  // Consolidated session command
  SESSION_COMMAND: 'sessions:command',

  // Pending plan execution (for reload recovery)
  GET_PENDING_PLAN_EXECUTION: 'sessions:getPendingPlanExecution',
  // Authoritative permission mode diagnostics for renderer reconciliation
  GET_SESSION_PERMISSION_MODE_STATE: 'sessions:getPermissionModeState',

  // Workspace management
  GET_WORKSPACES: 'workspaces:get',
  CREATE_WORKSPACE: 'workspaces:create',
  CHECK_WORKSPACE_SLUG: 'workspaces:checkSlug',

  // Window management
  GET_WINDOW_WORKSPACE: 'window:getWorkspace',
  GET_WINDOW_MODE: 'window:getMode',
  OPEN_WORKSPACE: 'window:openWorkspace',
  OPEN_SESSION_IN_NEW_WINDOW: 'window:openSessionInNewWindow',
  SWITCH_WORKSPACE: 'window:switchWorkspace',
  CLOSE_WINDOW: 'window:close',
  // Close request events (main → renderer, for intercepting X button / Cmd+W)
  WINDOW_CLOSE_REQUESTED: 'window:closeRequested',
  WINDOW_CONFIRM_CLOSE: 'window:confirmClose',
  WINDOW_CANCEL_CLOSE: 'window:cancelClose',
  // Traffic light visibility (macOS only - hide when fullscreen overlays are open)
  WINDOW_SET_TRAFFIC_LIGHTS: 'window:setTrafficLights',

  // Events from main to renderer
  SESSION_EVENT: 'session:event',

  // File operations
  READ_FILE: 'file:read',
  READ_FILE_DATA_URL: 'file:readDataUrl',
  READ_FILE_BINARY: 'file:readBinary',
  OPEN_FILE_DIALOG: 'file:openDialog',
  READ_FILE_ATTACHMENT: 'file:readAttachment',
  STORE_ATTACHMENT: 'file:storeAttachment',
  GENERATE_THUMBNAIL: 'file:generateThumbnail',

  // Filesystem search (for @ mention file selection)
  FS_SEARCH: 'fs:search',
  // Debug logging from renderer → main log file
  DEBUG_LOG: 'debug:log',

  // Session info panel
  GET_SESSION_FILES: 'sessions:getFiles',
  GET_SESSION_NOTES: 'sessions:getNotes',
  SET_SESSION_NOTES: 'sessions:setNotes',
  WATCH_SESSION_FILES: 'sessions:watchFiles',      // Start watching session directory
  UNWATCH_SESSION_FILES: 'sessions:unwatchFiles',  // Stop watching
  SESSION_FILES_CHANGED: 'sessions:filesChanged',  // Event: main → renderer

  // Theme
  GET_SYSTEM_THEME: 'theme:getSystemPreference',
  SYSTEM_THEME_CHANGED: 'theme:systemChanged',

  // System
  GET_VERSIONS: 'system:versions',
  GET_HOME_DIR: 'system:homeDir',
  IS_DEBUG_MODE: 'system:isDebugMode',

  // Auto-update
  UPDATE_CHECK: 'update:check',
  UPDATE_GET_INFO: 'update:getInfo',
  UPDATE_INSTALL: 'update:install',
  UPDATE_DISMISS: 'update:dismiss',  // Dismiss update for this version (persists across restarts)
  UPDATE_GET_DISMISSED: 'update:getDismissed',  // Get dismissed version
  UPDATE_AVAILABLE: 'update:available',  // main → renderer broadcast
  UPDATE_DOWNLOAD_PROGRESS: 'update:downloadProgress',  // main → renderer broadcast

  // Shell operations (open external URLs/files)
  OPEN_URL: 'shell:openUrl',
  OPEN_FILE: 'shell:openFile',
  SHOW_IN_FOLDER: 'shell:showInFolder',

  // Menu actions (main → renderer)
  MENU_NEW_CHAT: 'menu:newChat',
  MENU_NEW_WINDOW: 'menu:newWindow',
  MENU_OPEN_SETTINGS: 'menu:openSettings',
  MENU_KEYBOARD_SHORTCUTS: 'menu:keyboardShortcuts',
  MENU_TOGGLE_FOCUS_MODE: 'menu:toggleFocusMode',
  MENU_TOGGLE_SIDEBAR: 'menu:toggleSidebar',
  // Deep link navigation (main → renderer, for external craftagents:// URLs)
  DEEP_LINK_NAVIGATE: 'deeplink:navigate',

  // Auth
  LOGOUT: 'auth:logout',
  SHOW_LOGOUT_CONFIRMATION: 'auth:showLogoutConfirmation',
  SHOW_DELETE_SESSION_CONFIRMATION: 'auth:showDeleteSessionConfirmation',

  // Credential health check (startup validation)
  CREDENTIAL_HEALTH_CHECK: 'credentials:healthCheck',

  // Onboarding
  ONBOARDING_GET_AUTH_STATE: 'onboarding:getAuthState',
  ONBOARDING_VALIDATE_MCP: 'onboarding:validateMcp',
  ONBOARDING_START_MCP_OAUTH: 'onboarding:startMcpOAuth',
  // Claude OAuth (two-step flow)
  ONBOARDING_START_CLAUDE_OAUTH: 'onboarding:startClaudeOAuth',
  ONBOARDING_EXCHANGE_CLAUDE_CODE: 'onboarding:exchangeClaudeCode',
  ONBOARDING_HAS_CLAUDE_OAUTH_STATE: 'onboarding:hasClaudeOAuthState',
  ONBOARDING_CLEAR_CLAUDE_OAUTH_STATE: 'onboarding:clearClaudeOAuthState',

  // LLM Connections (provider configurations)
  LLM_CONNECTION_LIST: 'LLM_Connection:list',
  LLM_CONNECTION_LIST_WITH_STATUS: 'LLM_Connection:listWithStatus',
  LLM_CONNECTION_GET: 'LLM_Connection:get',
  LLM_CONNECTION_GET_API_KEY: 'LLM_Connection:getApiKey',
  LLM_CONNECTION_SAVE: 'LLM_Connection:save',
  LLM_CONNECTION_DELETE: 'LLM_Connection:delete',
  LLM_CONNECTION_TEST: 'LLM_Connection:test',
  LLM_CONNECTION_SET_DEFAULT: 'LLM_Connection:setDefault',
  LLM_CONNECTION_SET_WORKSPACE_DEFAULT: 'LLM_Connection:setWorkspaceDefault',
  LLM_CONNECTION_REFRESH_MODELS: 'LLM_Connection:refreshModels',
  LLM_CONNECTIONS_CHANGED: 'LLM_Connection:changed',  // Broadcast event

  // ChatGPT OAuth (for Codex chatgptAuthTokens mode)
  CHATGPT_START_OAUTH: 'chatgpt:startOAuth',
  CHATGPT_CANCEL_OAUTH: 'chatgpt:cancelOAuth',
  CHATGPT_GET_AUTH_STATUS: 'chatgpt:getAuthStatus',
  CHATGPT_LOGOUT: 'chatgpt:logout',

  // GitHub Copilot OAuth
  COPILOT_START_OAUTH: 'copilot:startOAuth',
  COPILOT_CANCEL_OAUTH: 'copilot:cancelOAuth',
  COPILOT_GET_AUTH_STATUS: 'copilot:getAuthStatus',
  COPILOT_LOGOUT: 'copilot:logout',
  COPILOT_DEVICE_CODE: 'copilot:deviceCode',

  // Settings - API Setup
  SETUP_LLM_CONNECTION: 'settings:setupLlmConnection',
  SETTINGS_TEST_LLM_CONNECTION_SETUP: 'settings:testLlmConnectionSetup',

  // Pi provider discovery (main process only — Pi SDK can't run in renderer)
  PI_GET_API_KEY_PROVIDERS: 'pi:getApiKeyProviders',
  PI_GET_PROVIDER_BASE_URL: 'pi:getProviderBaseUrl',
  PI_GET_PROVIDER_MODELS: 'pi:getProviderModels',

  // Settings - Model
  SESSION_GET_MODEL: 'session:getModel',
  SESSION_SET_MODEL: 'session:setModel',

  // Folder dialog (for selecting working directory)
  OPEN_FOLDER_DIALOG: 'dialog:openFolder',

  // User Preferences
  PREFERENCES_READ: 'preferences:read',
  PREFERENCES_WRITE: 'preferences:write',

  // Session Drafts (input text persisted across app restarts)
  DRAFTS_GET: 'drafts:get',
  DRAFTS_SET: 'drafts:set',
  DRAFTS_DELETE: 'drafts:delete',
  DRAFTS_GET_ALL: 'drafts:getAll',

  // Sources (workspace-scoped)
  SOURCES_GET: 'sources:get',
  SOURCES_CREATE: 'sources:create',
  SOURCES_DELETE: 'sources:delete',
  SOURCES_START_OAUTH: 'sources:startOAuth',
  SOURCES_SAVE_CREDENTIALS: 'sources:saveCredentials',
  SOURCES_CHANGED: 'sources:changed',

  // Source permissions config
  SOURCES_GET_PERMISSIONS: 'sources:getPermissions',
  // Workspace permissions config (for Explore mode)
  WORKSPACE_GET_PERMISSIONS: 'workspace:getPermissions',
  // Default permissions from ~/.craft-agent/permissions/default.json
  DEFAULT_PERMISSIONS_GET: 'permissions:getDefaults',
  // Broadcast when default permissions change (file watcher)
  DEFAULT_PERMISSIONS_CHANGED: 'permissions:defaultsChanged',
  // MCP tools listing
  SOURCES_GET_MCP_TOOLS: 'sources:getMcpTools',

  // Session content search (full-text via ripgrep)
  SEARCH_SESSIONS: 'sessions:searchContent',

  // Skills (workspace-scoped)
  SKILLS_GET: 'skills:get',
  SKILLS_GET_FILES: 'skills:getFiles',
  SKILLS_DELETE: 'skills:delete',
  SKILLS_OPEN_EDITOR: 'skills:openEditor',
  SKILLS_OPEN_FINDER: 'skills:openFinder',
  SKILLS_CHANGED: 'skills:changed',

  // Status management (workspace-scoped)
  STATUSES_LIST: 'statuses:list',
  STATUSES_REORDER: 'statuses:reorder',  // Reorder statuses (drag-and-drop)
  STATUSES_CHANGED: 'statuses:changed',  // Broadcast event

  // Label management (workspace-scoped)
  LABELS_LIST: 'labels:list',
  LABELS_CREATE: 'labels:create',
  LABELS_DELETE: 'labels:delete',
  LABELS_CHANGED: 'labels:changed',  // Broadcast event

  // Hooks management (workspace-scoped)
  HOOKS_LIST: 'hooks:list',
  HOOKS_CHANGED: 'hooks:changed',  // Broadcast event

  // Projects management (workspace-scoped)
  PROJECTS_LIST: 'projects:list',
  PROJECTS_GET: 'projects:get',
  PROJECTS_CHANGED: 'projects:changed',  // Broadcast event

  // Views management (workspace-scoped, stored in views.json)
  VIEWS_LIST: 'views:list',
  VIEWS_SAVE: 'views:save',

  // Theme management (cascading: app → workspace)
  THEME_APP_CHANGED: 'theme:appChanged',        // Broadcast event

  // Generic workspace image loading/saving (for icons, etc.)
  WORKSPACE_READ_IMAGE: 'workspace:readImage',
  WORKSPACE_WRITE_IMAGE: 'workspace:writeImage',

  // Workspace settings (per-workspace configuration)
  WORKSPACE_SETTINGS_GET: 'workspaceSettings:get',
  WORKSPACE_SETTINGS_UPDATE: 'workspaceSettings:update',

  // Theme (app-level default)
  THEME_GET_APP: 'theme:getApp',
  THEME_GET_PRESETS: 'theme:getPresets',
  THEME_LOAD_PRESET: 'theme:loadPreset',
  THEME_GET_COLOR_THEME: 'theme:getColorTheme',
  THEME_SET_COLOR_THEME: 'theme:setColorTheme',
  THEME_BROADCAST_PREFERENCES: 'theme:broadcastPreferences',  // Send preferences to main for broadcast
  THEME_PREFERENCES_CHANGED: 'theme:preferencesChanged',  // Broadcast: preferences changed in another window

  // Workspace-level theme overrides
  THEME_GET_WORKSPACE_COLOR_THEME: 'theme:getWorkspaceColorTheme',
  THEME_SET_WORKSPACE_COLOR_THEME: 'theme:setWorkspaceColorTheme',
  THEME_GET_ALL_WORKSPACE_THEMES: 'theme:getAllWorkspaceThemes',
  THEME_BROADCAST_WORKSPACE_THEME: 'theme:broadcastWorkspaceTheme',  // Send workspace theme change to main for broadcast
  THEME_WORKSPACE_THEME_CHANGED: 'theme:workspaceThemeChanged',  // Broadcast: workspace theme changed in another window

  // Tool icon mappings (for Appearance settings)
  TOOL_ICONS_GET_MAPPINGS: 'toolIcons:getMappings',

  // Logo URL resolution (uses Node.js filesystem cache)
  LOGO_GET_URL: 'logo:getUrl',

  // Notifications
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_NAVIGATE: 'notification:navigate',  // Broadcast: { workspaceId, sessionId }
  NOTIFICATION_GET_ENABLED: 'notification:getEnabled',
  NOTIFICATION_SET_ENABLED: 'notification:setEnabled',

  // Input settings
  INPUT_GET_AUTO_CAPITALISATION: 'input:getAutoCapitalisation',
  INPUT_SET_AUTO_CAPITALISATION: 'input:setAutoCapitalisation',
  INPUT_GET_SEND_MESSAGE_KEY: 'input:getSendMessageKey',
  INPUT_SET_SEND_MESSAGE_KEY: 'input:setSendMessageKey',
  INPUT_GET_SPELL_CHECK: 'input:getSpellCheck',
  INPUT_SET_SPELL_CHECK: 'input:setSpellCheck',

  // Power settings
  POWER_GET_KEEP_AWAKE: 'power:getKeepAwake',
  POWER_SET_KEEP_AWAKE: 'power:setKeepAwake',

  // Appearance settings
  APPEARANCE_GET_RICH_TOOL_DESCRIPTIONS: 'appearance:getRichToolDescriptions',
  APPEARANCE_SET_RICH_TOOL_DESCRIPTIONS: 'appearance:setRichToolDescriptions',

  BADGE_REFRESH: 'badge:refresh',
  BADGE_SET_ICON: 'badge:setIcon',
  BADGE_DRAW: 'badge:draw',  // Broadcast: { count: number, iconDataUrl: string }
  BADGE_DRAW_WINDOWS: 'badge:draw-windows',  // Broadcast: { count: number }
  WINDOW_FOCUS_STATE: 'window:focusState',  // Broadcast: boolean (isFocused)
  WINDOW_GET_FOCUS_STATE: 'window:getFocusState',

  // Release notes
  GET_RELEASE_NOTES: 'releaseNotes:get',
  GET_LATEST_RELEASE_VERSION: 'releaseNotes:getLatestVersion',

  // Git operations
  GET_GIT_BRANCH: 'git:getBranch',

  // Git Bash (Windows)
  GITBASH_CHECK: 'gitbash:check',
  GITBASH_BROWSE: 'gitbash:browse',
  GITBASH_SET_PATH: 'gitbash:setPath',

  // Browser pane management
  BROWSER_PANE_CREATE: 'browser-pane:create',
  BROWSER_PANE_DESTROY: 'browser-pane:destroy',
  BROWSER_PANE_LIST: 'browser-pane:list',
  BROWSER_PANE_NAVIGATE: 'browser-pane:navigate',
  BROWSER_PANE_GO_BACK: 'browser-pane:go-back',
  BROWSER_PANE_GO_FORWARD: 'browser-pane:go-forward',
  BROWSER_PANE_RELOAD: 'browser-pane:reload',
  BROWSER_PANE_STOP: 'browser-pane:stop',
  BROWSER_PANE_FOCUS: 'browser-pane:focus',
  BROWSER_PANE_SNAPSHOT: 'browser-pane:snapshot',
  BROWSER_PANE_CLICK: 'browser-pane:click',
  BROWSER_PANE_FILL: 'browser-pane:fill',
  BROWSER_PANE_SELECT: 'browser-pane:select',
  BROWSER_PANE_SCREENSHOT: 'browser-pane:screenshot',
  BROWSER_PANE_EVALUATE: 'browser-pane:evaluate',
  BROWSER_PANE_SCROLL: 'browser-pane:scroll',
  BROWSER_EMPTY_STATE_LAUNCH: 'browser-empty-state:launch',
  // Browser pane events (main → renderer)
  BROWSER_PANE_STATE_CHANGED: 'browser-pane:state-changed',
  BROWSER_PANE_REMOVED: 'browser-pane:removed',
  BROWSER_PANE_INTERACTED: 'browser-pane:interacted',

  // Menu actions (renderer → main for window/app control)
  MENU_QUIT: 'menu:quit',
  MENU_MINIMIZE: 'menu:minimize',
  MENU_MAXIMIZE: 'menu:maximize',
  MENU_ZOOM_IN: 'menu:zoomIn',
  MENU_ZOOM_OUT: 'menu:zoomOut',
  MENU_ZOOM_RESET: 'menu:zoomReset',
  MENU_TOGGLE_DEVTOOLS: 'menu:toggleDevTools',
  MENU_UNDO: 'menu:undo',
  MENU_REDO: 'menu:redo',
  MENU_CUT: 'menu:cut',
  MENU_COPY: 'menu:copy',
  MENU_PASTE: 'menu:paste',
  MENU_SELECT_ALL: 'menu:selectAll',

  // Automations (manual trigger + state management)
  TEST_AUTOMATION: 'automations:test',
  AUTOMATIONS_SET_ENABLED: 'automations:setEnabled',
  AUTOMATIONS_DUPLICATE: 'automations:duplicate',
  AUTOMATIONS_DELETE: 'automations:delete',
  AUTOMATIONS_GET_HISTORY: 'automations:getHistory',
  AUTOMATIONS_GET_LAST_EXECUTED: 'automations:getLastExecuted',
  AUTOMATIONS_CHANGED: 'automations:changed',  // Broadcast event
} as const

export const BROWSER_TOOLBAR_CHANNELS = {
  NAVIGATE: 'browser-toolbar:navigate',
  GO_BACK: 'browser-toolbar:go-back',
  GO_FORWARD: 'browser-toolbar:go-forward',
  RELOAD: 'browser-toolbar:reload',
  STOP: 'browser-toolbar:stop',
  OPEN_MENU: 'browser-toolbar:open-menu',
  HIDE: 'browser-toolbar:hide',
  DESTROY: 'browser-toolbar:destroy',
  STATE_UPDATE: 'browser-toolbar:state-update',
  THEME_COLOR: 'browser-toolbar:theme-color',
} as const

/** Tool icon mapping entry from tool-icons.json (with icon resolved to data URL) */
export interface ToolIconMapping {
  id: string
  displayName: string
  /** Data URL of the icon (e.g., data:image/png;base64,...) */
  iconDataUrl: string
  commands: string[]
}

/**
 * Browser pane creation options
 */
export interface BrowserPaneCreateOptions {
  id?: string
  show?: boolean
  bindToSessionId?: string
}

/**
 * Empty-state launch request from the browser empty-state renderer.
 */
export interface BrowserEmptyStateLaunchPayload {
  route: string
  token?: string
}

/**
 * Result of browser empty-state launch handling.
 */
export interface BrowserEmptyStateLaunchResult {
  ok: boolean
  handled: boolean
  reason?: string
}

export type TransportMode = 'local' | 'remote'

export type TransportConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed'

export type TransportConnectionErrorKind =
  | 'auth'
  | 'protocol'
  | 'timeout'
  | 'network'
  | 'server'
  | 'unknown'

export interface TransportConnectionError {
  kind: TransportConnectionErrorKind
  message: string
  code?: string
}

export interface TransportCloseInfo {
  code?: number
  reason?: string
  wasClean?: boolean
}

export interface TransportConnectionState {
  mode: TransportMode
  status: TransportConnectionStatus
  url: string
  attempt: number
  nextRetryInMs?: number
  lastError?: TransportConnectionError
  lastClose?: TransportCloseInfo
  updatedAt: number
}

// =============================================================================
// ElectronAPI — type-safe IPC API exposed to renderer
// =============================================================================

// Re-import types for ElectronAPI
import type { Workspace, SessionMetadata, StoredAttachment as StoredAttachmentType } from '@craft-agent/core/types';

// Import protocol types used by ElectronAPI
import type {
  Session,
  UnreadSummary,
  CreateSessionOptions,
  FileAttachment,
  SendMessageOptions,
  SessionEvent,
  PermissionResponseOptions,
  CredentialResponse,
  SessionCommand,
  ShareResult,
  RefreshTitleResult,
  FileSearchResult,
  SessionSearchResult,
  LlmConnectionSetup,
  TestLlmConnectionParams,
  TestLlmConnectionResult,
  SkillFile,
  SessionFile,
  OAuthResult,
  McpToolsResult,
  GitBashStatus,
  ClaudeOAuthResult,
  UpdateInfo,
  WorkspaceSettings,
  PermissionModeState,
  BrowserInstanceInfo,
  DeepLinkNavigation,
  TestAutomationPayload,
  TestAutomationResult,
  WindowCloseRequest,
} from '@craft-agent/shared/protocol'

export interface ElectronAPI {
  // Session management
  getSessions(): Promise<Session[]>
  getUnreadSummary(): Promise<UnreadSummary>
  markAllSessionsRead(workspaceId: string): Promise<void>
  getSessionMessages(sessionId: string): Promise<Session | null>
  createSession(workspaceId: string, options?: CreateSessionOptions): Promise<Session>
  deleteSession(sessionId: string): Promise<void>
  sendMessage(sessionId: string, message: string, attachments?: FileAttachment[], storedAttachments?: StoredAttachmentType[], options?: SendMessageOptions): Promise<void>
  cancelProcessing(sessionId: string, silent?: boolean): Promise<void>
  killShell(sessionId: string, shellId: string): Promise<{ success: boolean; error?: string }>
  getTaskOutput(taskId: string): Promise<string | null>
  respondToPermission(sessionId: string, requestId: string, allowed: boolean, alwaysAllow: boolean, options?: PermissionResponseOptions): Promise<boolean>
  respondToCredential(sessionId: string, requestId: string, response: CredentialResponse): Promise<boolean>

  // Consolidated session command handler
  sessionCommand(sessionId: string, command: SessionCommand): Promise<void | ShareResult | RefreshTitleResult | { count: number }>

  // Pending plan execution (for reload recovery)
  getPendingPlanExecution(sessionId: string): Promise<{ planPath: string; draftInputSnapshot?: string; awaitingCompaction: boolean } | null>
  // Permission mode reconciliation
  getSessionPermissionModeState(sessionId: string): Promise<PermissionModeState | null>

  // Workspace management
  getWorkspaces(): Promise<Workspace[]>
  createWorkspace(folderPath: string, name: string): Promise<Workspace>
  checkWorkspaceSlug(slug: string): Promise<{ exists: boolean; path: string }>

  // Window management
  getWindowWorkspace(): Promise<string | null>
  getWindowMode(): Promise<string | null>
  openWorkspace(workspaceId: string): Promise<void>
  openSessionInNewWindow(workspaceId: string, sessionId: string): Promise<void>
  switchWorkspace(workspaceId: string): Promise<void>
  closeWindow(): Promise<void>
  confirmCloseWindow(): Promise<void>
  /** Cancel a pending close request (renderer handled it by closing a modal/panel). */
  cancelCloseWindow(): Promise<void>
  /** Listen for close requests and receive source metadata. Returns cleanup function. */
  onCloseRequested(callback: (request: WindowCloseRequest) => void): () => void
  /** Show/hide macOS traffic light buttons (for fullscreen overlays) */
  setTrafficLightsVisible(visible: boolean): Promise<void>

  // Event listeners
  onSessionEvent(callback: (event: SessionEvent) => void): () => void
  onUnreadSummaryChanged(callback: (summary: UnreadSummary) => void): () => void

  // File operations
  readFile(path: string): Promise<string>
  /** Read a file as binary data (Uint8Array) */
  readFileBinary(path: string): Promise<Uint8Array>
  /** Read a file as a data URL (data:{mime};base64,...) for binary preview (images, PDFs) */
  readFileDataUrl(path: string): Promise<string>
  openFileDialog(): Promise<string[]>
  readFileAttachment(path: string): Promise<FileAttachment | null>
  storeAttachment(sessionId: string, attachment: FileAttachment): Promise<import('../../../../packages/core/src/types/index.ts').StoredAttachment>
  generateThumbnail(base64: string, mimeType: string): Promise<string | null>

  // Filesystem search (for @ mention file selection)
  searchFiles(basePath: string, query: string): Promise<FileSearchResult[]>
  // Debug: send renderer logs to main process log file
  debugLog(...args: unknown[]): void

  // Theme
  getSystemTheme(): Promise<boolean>
  onSystemThemeChange(callback: (isDark: boolean) => void): () => void

  // System
  getVersions(): { node: string; chrome: string; electron: string }
  getHomeDir(): Promise<string>
  isDebugMode(): Promise<boolean>

  // Transport connection status (preload-local, not RPC channels)
  getTransportConnectionState(): Promise<TransportConnectionState>
  onTransportConnectionStateChanged(callback: (state: TransportConnectionState) => void): () => void
  reconnectTransport(): Promise<void>

  /** Check whether the server registered a handler for a given RPC channel. */
  isChannelAvailable(channel: string): boolean

  // Auto-update
  checkForUpdates(): Promise<UpdateInfo>
  getUpdateInfo(): Promise<UpdateInfo>
  installUpdate(): Promise<void>
  dismissUpdate(version: string): Promise<void>
  getDismissedUpdateVersion(): Promise<string | null>
  onUpdateAvailable(callback: (info: UpdateInfo) => void): () => void
  onUpdateDownloadProgress(callback: (progress: number) => void): () => void

  // Release notes
  getReleaseNotes(): Promise<string>
  getLatestReleaseVersion(): Promise<string | undefined>

  // Shell operations
  openUrl(url: string): Promise<void>
  openFile(path: string): Promise<void>
  showInFolder(path: string): Promise<void>

  // Menu event listeners
  onMenuNewChat(callback: () => void): () => void
  onMenuOpenSettings(callback: () => void): () => void
  onMenuKeyboardShortcuts(callback: () => void): () => void
  onMenuToggleFocusMode(callback: () => void): () => void
  onMenuToggleSidebar(callback: () => void): () => void

  // Deep link navigation listener (for external craftagents:// URLs)
  onDeepLinkNavigate(callback: (nav: DeepLinkNavigation) => void): () => void

  // Auth
  showLogoutConfirmation(): Promise<boolean>
  showDeleteSessionConfirmation(name: string): Promise<boolean>
  logout(): Promise<void>

  // Credential health check (startup validation)
  getCredentialHealth(): Promise<CredentialHealthStatus>

  // Onboarding
  getAuthState(): Promise<AuthState>
  getSetupNeeds(): Promise<SetupNeeds>
  startWorkspaceMcpOAuth(mcpUrl: string): Promise<OAuthResult & { clientId?: string }>
  // Claude OAuth (two-step flow)
  startClaudeOAuth(): Promise<{ success: boolean; authUrl?: string; error?: string }>
  exchangeClaudeCode(code: string, connectionSlug: string): Promise<ClaudeOAuthResult>
  hasClaudeOAuthState(): Promise<boolean>
  clearClaudeOAuthState(): Promise<{ success: boolean }>

  // ChatGPT OAuth (for Codex chatgptAuthTokens mode)
  startChatGptOAuth(connectionSlug: string): Promise<{ success: boolean; error?: string }>
  cancelChatGptOAuth(): Promise<{ success: boolean }>
  getChatGptAuthStatus(connectionSlug: string): Promise<{ authenticated: boolean; expiresAt?: number; hasRefreshToken?: boolean }>
  chatGptLogout(connectionSlug: string): Promise<{ success: boolean }>

  // GitHub Copilot OAuth
  startCopilotOAuth(connectionSlug: string): Promise<{ success: boolean; error?: string }>
  cancelCopilotOAuth(): Promise<{ success: boolean }>
  getCopilotAuthStatus(connectionSlug: string): Promise<{ authenticated: boolean }>
  copilotLogout(connectionSlug: string): Promise<{ success: boolean }>
  onCopilotDeviceCode(callback: (data: { userCode: string; verificationUri: string }) => void): () => void

  /** Unified LLM connection setup */
  setupLlmConnection(setup: LlmConnectionSetup): Promise<{ success: boolean; error?: string }>
  /** Unified connection test — spawns a lightweight agent subprocess to validate credentials */
  testLlmConnectionSetup(params: TestLlmConnectionParams): Promise<TestLlmConnectionResult>
  // Pi provider discovery (main process only — Pi SDK can't run in renderer)
  getPiApiKeyProviders(): Promise<Array<{ key: string; label: string; placeholder: string }>>
  getPiProviderBaseUrl(provider: string): Promise<string | undefined>
  getPiProviderModels(provider: string): Promise<{ models: Array<{ id: string; name: string; costInput: number; costOutput: number; contextWindow: number; reasoning: boolean }>; totalCount: number }>

  // Session-specific model (overrides global)
  getSessionModel(sessionId: string, workspaceId: string): Promise<string | null>
  setSessionModel(sessionId: string, workspaceId: string, model: string | null, connection?: string): Promise<void>

  // Workspace Settings (per-workspace configuration)
  getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings | null>
  updateWorkspaceSetting<K extends keyof WorkspaceSettings>(workspaceId: string, key: K, value: WorkspaceSettings[K]): Promise<void>

  // Folder dialog
  openFolderDialog(): Promise<string | null>

  // User Preferences
  readPreferences(): Promise<{ content: string; exists: boolean; path: string }>
  writePreferences(content: string): Promise<{ success: boolean; error?: string }>

  // Session Drafts (persisted input text)
  getDraft(sessionId: string): Promise<string | null>
  setDraft(sessionId: string, text: string): Promise<void>
  deleteDraft(sessionId: string): Promise<void>
  getAllDrafts(): Promise<Record<string, string>>

  // Session Info Panel
  getSessionFiles(sessionId: string): Promise<SessionFile[]>
  getSessionNotes(sessionId: string): Promise<string>
  setSessionNotes(sessionId: string, content: string): Promise<void>
  watchSessionFiles(sessionId: string): Promise<void>
  unwatchSessionFiles(): Promise<void>
  onSessionFilesChanged(callback: (sessionId: string) => void): () => void

  // Sources
  getSources(workspaceId: string): Promise<LoadedSource[]>
  createSource(workspaceId: string, config: Partial<FolderSourceConfig>): Promise<FolderSourceConfig>
  deleteSource(workspaceId: string, sourceSlug: string): Promise<void>
  startSourceOAuth(workspaceId: string, sourceSlug: string): Promise<{ success: boolean; error?: string }>
  saveSourceCredentials(workspaceId: string, sourceSlug: string, credential: string): Promise<void>
  getSourcePermissionsConfig(workspaceId: string, sourceSlug: string): Promise<import('@craft-agent/shared/agent').PermissionsConfigFile | null>
  getWorkspacePermissionsConfig(workspaceId: string): Promise<import('@craft-agent/shared/agent').PermissionsConfigFile | null>
  getDefaultPermissionsConfig(): Promise<{ config: import('@craft-agent/shared/agent').PermissionsConfigFile | null; path: string }>
  getMcpTools(workspaceId: string, sourceSlug: string): Promise<McpToolsResult>

  // OAuth (server-owned credentials, client-orchestrated flow)
  performOAuth(args: { sourceSlug: string; sessionId?: string; authRequestId?: string }): Promise<{ success: boolean; error?: string; email?: string }>
  oauthRevoke(sourceSlug: string): Promise<{ success: boolean }>

  // Session content search (full-text search via ripgrep)
  searchSessionContent(workspaceId: string, query: string, searchId?: string): Promise<SessionSearchResult[]>

  // Sources change listener (live updates when sources are added/removed)
  onSourcesChanged(callback: (workspaceId: string, sources: LoadedSource[]) => void): () => void

  // Default permissions change listener (live updates when default.json changes)
  onDefaultPermissionsChanged(callback: () => void): () => void

  // Skills
  getSkills(workspaceId: string, workingDirectory?: string): Promise<LoadedSkill[]>
  getSkillFiles?(workspaceId: string, skillSlug: string): Promise<SkillFile[]>
  deleteSkill(workspaceId: string, skillSlug: string): Promise<void>
  openSkillInEditor(workspaceId: string, skillSlug: string): Promise<void>
  openSkillInFinder(workspaceId: string, skillSlug: string): Promise<void>

  // Skills change listener (live updates when skills are added/removed/modified)
  onSkillsChanged(callback: (workspaceId: string, skills: LoadedSkill[]) => void): () => void

  // Statuses (workspace-scoped)
  listStatuses(workspaceId: string): Promise<import('@craft-agent/shared/statuses').StatusConfig[]>
  reorderStatuses(workspaceId: string, orderedIds: string[]): Promise<void>
  onStatusesChanged(callback: (workspaceId: string) => void): () => void

  // Labels (workspace-scoped)
  listLabels(workspaceId: string): Promise<import('@craft-agent/shared/labels').LabelConfig[]>
  createLabel(workspaceId: string, input: import('@craft-agent/shared/labels').CreateLabelInput): Promise<import('@craft-agent/shared/labels').LabelConfig>
  deleteLabel(workspaceId: string, labelId: string): Promise<{ stripped: number }>
  onLabelsChanged(callback: (workspaceId: string) => void): () => void

  // Hooks (workspace-scoped)
  listHooks(workspaceId: string): Promise<HooksListResult>
  // Hooks change listener (live updates when hooks.json changes)
  onHooksChanged(callback: (workspaceId: string) => void): () => void

  // Projects (workspace-scoped)
  listProjects(workspaceId: string): Promise<ProjectListResult>
  getProject(workspaceId: string, slug: string): Promise<ProjectDetailResult>
  // Projects change listener (live updates when projects/ directory changes)
  onProjectsChanged(callback: (workspaceId: string) => void): () => void

  // LLM connections change listener (live updates when models are fetched or connections are modified)
  onLlmConnectionsChanged(callback: () => void): () => void

  // Views (workspace-scoped, stored in views.json)
  listViews(workspaceId: string): Promise<import('@craft-agent/shared/views').ViewConfig[]>
  saveViews(workspaceId: string, views: import('@craft-agent/shared/views').ViewConfig[]): Promise<void>

  // Generic workspace image loading/saving
  readWorkspaceImage(workspaceId: string, relativePath: string): Promise<string>
  writeWorkspaceImage(workspaceId: string, relativePath: string, base64: string, mimeType: string): Promise<void>

  // Tool icon mappings
  getToolIconMappings(): Promise<ToolIconMapping[]>

  // Theme (app-level default)
  getAppTheme(): Promise<import('@config/theme').ThemeOverrides | null>
  loadPresetThemes(): Promise<import('@config/theme').PresetTheme[]>
  loadPresetTheme(themeId: string): Promise<import('@config/theme').PresetTheme | null>
  getColorTheme(): Promise<string>
  setColorTheme(themeId: string): Promise<void>
  getWorkspaceColorTheme(workspaceId: string): Promise<string | null>
  setWorkspaceColorTheme(workspaceId: string, themeId: string | null): Promise<void>
  getAllWorkspaceThemes(): Promise<Record<string, string | undefined>>

  // Theme change listeners
  onAppThemeChange(callback: (theme: import('@config/theme').ThemeOverrides | null) => void): () => void

  // Logo URL resolution
  getLogoUrl(serviceUrl: string, provider?: string): Promise<string | null>

  // Notifications
  showNotification(title: string, body: string, workspaceId: string, sessionId: string): Promise<void>
  getNotificationsEnabled(): Promise<boolean>
  setNotificationsEnabled(enabled: boolean): Promise<void>

  // Input settings
  getAutoCapitalisation(): Promise<boolean>
  setAutoCapitalisation(enabled: boolean): Promise<void>
  getSendMessageKey(): Promise<'enter' | 'cmd-enter'>
  setSendMessageKey(key: 'enter' | 'cmd-enter'): Promise<void>
  getSpellCheck(): Promise<boolean>
  setSpellCheck(enabled: boolean): Promise<void>

  // Power settings
  getKeepAwakeWhileRunning(): Promise<boolean>
  setKeepAwakeWhileRunning(enabled: boolean): Promise<void>

  // Appearance settings
  getRichToolDescriptions(): Promise<boolean>
  setRichToolDescriptions(enabled: boolean): Promise<void>

  // Network proxy settings
  getNetworkProxySettings(): Promise<NetworkProxySettings | undefined>
  setNetworkProxySettings(settings: NetworkProxySettings): Promise<void>

  refreshBadge(): Promise<void>
  setDockIconWithBadge(dataUrl: string): Promise<void>
  onBadgeDraw(callback: (data: { count: number; iconDataUrl: string }) => void): () => void
  onBadgeDrawWindows(callback: (data: { count: number }) => void): () => void
  getWindowFocusState(): Promise<boolean>
  onWindowFocusChange(callback: (isFocused: boolean) => void): () => void
  onNotificationNavigate(callback: (data: { workspaceId: string; sessionId: string }) => void): () => void

  // Theme preferences sync across windows
  broadcastThemePreferences(preferences: { mode: string; colorTheme: string; font: string }): Promise<void>
  onThemePreferencesChange(callback: (preferences: { mode: string; colorTheme: string; font: string }) => void): () => void

  // Workspace theme sync across windows
  broadcastWorkspaceThemeChange(workspaceId: string, themeId: string | null): Promise<void>
  onWorkspaceThemeChange(callback: (data: { workspaceId: string; themeId: string | null }) => void): () => void

  // Git operations
  getGitBranch(dirPath: string): Promise<string | null>

  // Git Bash (Windows)
  checkGitBash(): Promise<GitBashStatus>
  browseForGitBash(): Promise<string | null>
  setGitBashPath(path: string): Promise<{ success: boolean; error?: string }>

  // Menu actions (from renderer to main)
  menuQuit(): Promise<void>
  menuNewWindow(): Promise<void>
  menuMinimize(): Promise<void>
  menuMaximize(): Promise<void>
  menuZoomIn(): Promise<void>
  menuZoomOut(): Promise<void>
  menuZoomReset(): Promise<void>
  menuToggleDevTools(): Promise<void>
  menuUndo(): Promise<void>
  menuRedo(): Promise<void>
  menuCut(): Promise<void>
  menuCopy(): Promise<void>
  menuPaste(): Promise<void>
  menuSelectAll(): Promise<void>

  // Browser pane management
  browserPane: {
    create(input?: string | BrowserPaneCreateOptions): Promise<string>
    destroy(id: string): Promise<void>
    list(): Promise<BrowserInstanceInfo[]>
    navigate(id: string, url: string): Promise<{ url: string; title: string }>
    goBack(id: string): Promise<void>
    goForward(id: string): Promise<void>
    reload(id: string): Promise<void>
    stop(id: string): Promise<void>
    focus(id: string): Promise<void>
    emptyStateLaunch(payload: BrowserEmptyStateLaunchPayload): Promise<BrowserEmptyStateLaunchResult>
    onStateChanged(callback: (info: BrowserInstanceInfo) => void): () => void
    onRemoved(callback: (id: string) => void): () => void
    onInteracted(callback: (id: string) => void): () => void
  }

  // LLM Connections (provider configurations)
  listLlmConnections(): Promise<LlmConnection[]>
  listLlmConnectionsWithStatus(): Promise<LlmConnectionWithStatus[]>
  getLlmConnection(slug: string): Promise<LlmConnection | null>
  getLlmConnectionApiKey(slug: string): Promise<string | null>
  saveLlmConnection(connection: LlmConnection): Promise<{ success: boolean; error?: string }>
  deleteLlmConnection(slug: string): Promise<{ success: boolean; error?: string }>
  testLlmConnection(slug: string): Promise<{ success: boolean; error?: string }>
  setDefaultLlmConnection(slug: string): Promise<{ success: boolean; error?: string }>
  getDefaultThinkingLevel(): Promise<ThinkingLevel>
  setDefaultThinkingLevel(level: ThinkingLevel): Promise<{ success: boolean; error?: string }>
  setWorkspaceDefaultLlmConnection(workspaceId: string, slug: string | null): Promise<{ success: boolean; error?: string }>

  // Automation testing (manual trigger)
  testAutomation(payload: TestAutomationPayload): Promise<TestAutomationResult>

  // Automation state management
  setAutomationEnabled(workspaceId: string, eventName: string, matcherIndex: number, enabled: boolean): Promise<void>
  duplicateAutomation(workspaceId: string, eventName: string, matcherIndex: number): Promise<void>
  deleteAutomation(workspaceId: string, eventName: string, matcherIndex: number): Promise<void>
  getAutomationHistory(workspaceId: string, automationId: string, limit?: number): Promise<Array<{ id: string; ts: number; ok: boolean; sessionId?: string; prompt?: string; error?: string; webhook?: { method: string; url: string; statusCode: number; durationMs: number; attempts?: number; error?: string; responseBody?: string } }>>
  getAutomationLastExecuted(workspaceId: string): Promise<Record<string, number>>
  replayAutomation(workspaceId: string, automationId: string, eventName: string): Promise<{ results: Array<{ type: string; url: string; statusCode: number; success: boolean; error?: string; duration: number }> }>

  // Automations change listener
  onAutomationsChanged(callback: (workspaceId: string) => void): () => void
}

// =============================================================================
// Navigation types (renderer-only)
// =============================================================================

/**
 * Right sidebar panel types
 */
export type RightSidebarPanel =
  | { type: 'files'; path?: string }
  | { type: 'history' }
  | { type: 'none' }

/**
 * Session filter options
 */
export type SessionFilter =
  | { kind: 'allSessions' }
  | { kind: 'flagged' }
  | { kind: 'state'; stateId: string }
  | { kind: 'label'; labelId: string; value?: string }
  | { kind: 'view'; viewId: string }
  | { kind: 'archived' }

/**
 * Settings subpage options - re-exported from settings-registry (single source of truth)
 */
export type { SettingsSubpage } from './settings-registry'
import { isValidSettingsSubpage, type SettingsSubpage } from './settings-registry'

/**
 * Sessions navigation state
 */
export interface SessionsNavigationState {
  navigator: 'sessions'
  filter: SessionFilter
  details: { type: 'session'; sessionId: string } | null
  rightSidebar?: RightSidebarPanel
}

/**
 * Source type filter for sources navigation
 */
export interface SourceFilter {
  kind: 'type'
  sourceType: 'api' | 'mcp' | 'local'
}

/**
 * Automation type filter for automations navigation
 */
export interface AutomationFilter {
  kind: 'type'
  automationType: 'scheduled' | 'event' | 'agentic'
}

/**
 * Sources navigation state
 */
export interface SourcesNavigationState {
  navigator: 'sources'
  filter?: SourceFilter
  details: { type: 'source'; sourceSlug: string } | null
  rightSidebar?: RightSidebarPanel
}

/**
 * Settings navigation state
 */
export interface SettingsNavigationState {
  navigator: 'settings'
  subpage: SettingsSubpage
  /** Optional detail slug (e.g., project slug for settings/projects/{slug}) */
  detail?: string
  /** Optional right sidebar panel state */
  rightSidebar?: RightSidebarPanel
}

/**
 * Skills navigation state
 */
export interface SkillsNavigationState {
  navigator: 'skills'
  details: { type: 'skill'; skillSlug: string } | null
  rightSidebar?: RightSidebarPanel
}

/**
 * Automations navigation state
 */
export interface AutomationsNavigationState {
  navigator: 'automations'
  filter?: AutomationFilter
  details: { type: 'automation'; automationId: string } | null
  rightSidebar?: RightSidebarPanel
}

/**
 * Unified navigation state
 */
export type NavigationState =
  | SessionsNavigationState
  | SourcesNavigationState
  | SettingsNavigationState
  | SkillsNavigationState
  | AutomationsNavigationState

export const isSessionsNavigation = (
  state: NavigationState
): state is SessionsNavigationState => state.navigator === 'sessions'

export const isSourcesNavigation = (
  state: NavigationState
): state is SourcesNavigationState => state.navigator === 'sources'

export const isSettingsNavigation = (
  state: NavigationState
): state is SettingsNavigationState => state.navigator === 'settings'

export const isSkillsNavigation = (
  state: NavigationState
): state is SkillsNavigationState => state.navigator === 'skills'

export const isAutomationsNavigation = (
  state: NavigationState
): state is AutomationsNavigationState => state.navigator === 'automations'

export const DEFAULT_NAVIGATION_STATE: NavigationState = {
  navigator: 'sessions',
  filter: { kind: 'allSessions' },
  details: null,
}

export const getNavigationStateKey = (state: NavigationState): string => {
  if (state.navigator === 'sources') {
    if (state.details) {
      return `sources/source/${state.details.sourceSlug}`
    }
    return 'sources'
  }
  if (state.navigator === 'skills') {
    if (state.details?.type === 'skill') {
      return `skills/skill/${state.details.skillSlug}`
    }
    return 'skills'
  }
  if (state.navigator === 'automations') {
    if (state.details?.type === 'automation') {
      return `automations/automation/${state.details.automationId}`
    }
    return 'automations'
  }
  if (state.navigator === 'settings') {
    return `settings:${state.subpage}`
  }
  // Chats
  const f = state.filter
  let base: string
  if (f.kind === 'state') base = `state:${f.stateId}`
  else if (f.kind === 'label') base = `label:${f.labelId}`
  else if (f.kind === 'view') base = `view:${f.viewId}`
  else base = f.kind
  if (state.details) {
    return `${base}/chat/${state.details.sessionId}`
  }
  return base
}

export const parseNavigationStateKey = (key: string): NavigationState | null => {
  // Handle sources
  if (key === 'sources') return { navigator: 'sources', details: null }
  if (key.startsWith('sources/source/')) {
    const sourceSlug = key.slice(15)
    if (sourceSlug) {
      return { navigator: 'sources', details: { type: 'source', sourceSlug } }
    }
    return { navigator: 'sources', details: null }
  }

  // Handle skills
  if (key === 'skills') return { navigator: 'skills', details: null }
  if (key.startsWith('skills/skill/')) {
    const skillSlug = key.slice(13)
    if (skillSlug) {
      return { navigator: 'skills', details: { type: 'skill', skillSlug } }
    }
    return { navigator: 'skills', details: null }
  }

  // Handle automations
  if (key === 'automations') return { navigator: 'automations', details: null }
  if (key.startsWith('automations/automation/')) {
    const automationId = key.slice(22)
    if (automationId) {
      return { navigator: 'automations', details: { type: 'automation', automationId } }
    }
    return { navigator: 'automations', details: null }
  }

  // Handle settings
  if (key.startsWith('settings:')) {
    const subpage = key.slice(9) as SettingsSubpage
    if (isValidSettingsSubpage(subpage)) {
      return { navigator: 'settings', subpage }
    }
    return null
  }

  // Handle sessions (default)
  let filter: SessionFilter
  let sessionIdSuffix: string | undefined
  const chatSep = '/chat/'
  const chatIdx = key.indexOf(chatSep)
  const filterPart = chatIdx >= 0 ? key.slice(0, chatIdx) : key
  sessionIdSuffix = chatIdx >= 0 ? key.slice(chatIdx + chatSep.length) : undefined

  if (filterPart === 'allSessions') filter = { kind: 'allSessions' }
  else if (filterPart === 'flagged') filter = { kind: 'flagged' }
  else if (filterPart === 'archived') filter = { kind: 'archived' }
  else if (filterPart.startsWith('state:')) filter = { kind: 'state', stateId: filterPart.slice(6) }
  else if (filterPart.startsWith('label:')) filter = { kind: 'label', labelId: filterPart.slice(6) }
  else if (filterPart.startsWith('view:')) filter = { kind: 'view', viewId: filterPart.slice(5) }
  else return null

  return {
    navigator: 'sessions',
    filter,
    details: sessionIdSuffix ? { type: 'session', sessionId: sessionIdSuffix } : null,
  }
}
