// Utility functions for tool use/result display
import { Terminal, FileCode, FileText, Pencil, Search, Globe, FolderSearch } from 'lucide-react';
import type { TFunction } from 'i18next';

/** Map a tool name to a small icon element */
export function getToolIcon(name: string) {
  const n = name.toLowerCase();
  if (n === 'bash' || n === 'execute_command') return <Terminal className="w-3.5 h-3.5" />;
  if (n === 'read' || n === 'read_file') return <FileCode className="w-3.5 h-3.5" />;
  if (n === 'write' || n === 'write_file') return <FileText className="w-3.5 h-3.5" />;
  if (n === 'edit' || n === 'edit_file') return <Pencil className="w-3.5 h-3.5" />;
  if (n === 'grep') return <Search className="w-3.5 h-3.5" />;
  if (n === 'glob') return <FolderSearch className="w-3.5 h-3.5" />;
  if (n === 'websearch') return <Globe className="w-3.5 h-3.5" />;
  if (n === 'webfetch') return <Globe className="w-3.5 h-3.5" />;
  return <Terminal className="w-3.5 h-3.5" />;
}

/** Shorten a file path to just filename or last 2 segments */
export function shortenPath(p: string): string {
  if (typeof p !== 'string') return String(p);
  const segments = p.replace(/\\/g, '/').split('/').filter(Boolean);
  if (segments.length <= 2) return segments.join('/');
  return segments.slice(-2).join('/');
}

export function getMcpToolDisplayName(name: string, displayName?: string): string {
  if (typeof displayName === 'string' && displayName.trim().length > 0) {
    return displayName;
  }

  if (name.startsWith('mcp__')) {
    const match = name.match(/^mcp__(.+?)__(.+)$/);
    return match?.[2] || name;
  }

  return name;
}

/** Get compact label: tool action + key argument */
export function getToolLabel(
  name: string,
  input: Record<string, unknown>,
  displayName: string | undefined,
  t: TFunction
): string {
  const inp = input || {};
  // MCP tools
  if (name.startsWith('mcp__')) {
    return getMcpToolDisplayName(name, displayName);
  }

  const nameLower = name.toLowerCase();
  if (nameLower === 'read' || nameLower === 'read_file') {
    const p = String(inp.file_path || inp.path || '');
    return p ? t('toolLabels.readPath', { path: shortenPath(p) }) : t('toolLabels.readFile');
  }
  if (nameLower === 'write' || nameLower === 'write_file') {
    const p = String(inp.file_path || inp.path || '');
    return p ? t('toolLabels.writePath', { path: shortenPath(p) }) : t('toolLabels.writeFile');
  }
  if (nameLower === 'edit' || nameLower === 'edit_file') {
    const p = String(inp.file_path || inp.path || '');
    return p ? t('toolLabels.editPath', { path: shortenPath(p) }) : t('toolLabels.editFile');
  }
  if (nameLower === 'bash' || nameLower === 'execute_command') {
    const cmd = String(inp.command || inp.cmd || '');
    if (cmd) {
      const short = cmd.length > 60 ? cmd.substring(0, 57) + '...' : cmd;
      return t('toolLabels.runCommandWith', { command: short });
    }
    return t('toolLabels.runCommand');
  }
  if (nameLower === 'glob') return inp.pattern ? t('toolLabels.globPattern', { pattern: String(inp.pattern) }) : t('toolLabels.glob');
  if (nameLower === 'grep') return inp.pattern ? t('toolLabels.grepPattern', { pattern: String(inp.pattern) }) : name;
  if (nameLower === 'websearch') return inp.query ? t('toolLabels.webSearchQuery', { query: String(inp.query) }) : t('toolLabels.webSearch');
  if (nameLower === 'webfetch') {
    const url = String(inp.url || '');
    return url ? t('toolLabels.fetchUrlWith', { url: url.length > 50 ? url.substring(0, 47) + '...' : url }) : t('toolLabels.fetchUrl');
  }
  return name;
}
