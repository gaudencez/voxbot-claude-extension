#!/usr/bin/env node
/**
 * Voxbot for Claude — the MCP server inside the Claude Desktop extension.
 *
 * Lets Claude drive the Voxbot menu-bar app directly, with no terminal.
 * Speaks MCP over stdio (newline-delimited JSON-RPC 2.0) and shells out to the
 * `voxbot` CLI that ships inside Voxbot.app, so it stays in step with the app.
 *
 * Deliberately dependency-free — no npm install, nothing to keep updated.
 * The same file runs for Claude Code (~/.claude/mcp-servers/voxbot-mcp.mjs).
 *
 * Nothing that spends credits starts from here on its own: films, sheets,
 * audio, music and images all stop on the Mac for the person's own click
 * ("Yes" / "Not yet") inside Voxbot before a cent is spent.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import readline from 'node:readline';

const VERSION = '1.1.0';

// Prefer the binary inside the installed app; fall back to the PATH symlink.
const CANDIDATES = [
  '/Applications/Voxbot.app/Contents/MacOS/voxbot',
  join(homedir(), 'Applications/Voxbot.app/Contents/MacOS/voxbot'),
  join(homedir(), '.local/bin/voxbot'),
  '/usr/local/bin/voxbot',
];
function voxbotPath() {
  return CANDIDATES.find((p) => existsSync(p)) ?? null;
}

const ORGANIZE_SH = join(
  homedir(),
  'Library/Application Support/VoiceType/organize.sh',
);

function run(bin, args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(bin, args, { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const out = String(stdout || '').trim();
        const errOut = String(stderr || '').trim();
        if (err && err.killed) {
          resolve({ ok: false, text: `Timed out after ${Math.round(timeoutMs / 1000)}s.` });
        } else if (err && !out && errOut) {
          resolve({ ok: false, text: errOut });
        } else if (err && !out) {
          resolve({ ok: false, text: String(err.message || err) });
        } else {
          resolve({ ok: !err, text: out || errOut || '(no output)' });
        }
      });
  });
}

async function callVoxbot(args, timeoutMs) {
  const bin = voxbotPath();
  if (!bin) {
    return {
      ok: false,
      text: 'Voxbot is not installed — get it at https://zxrstudios.com/voxbot and open it once.',
    };
  }
  return run(bin, args, timeoutMs);
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

const TOOLS = [
  {
    name: 'voxbot_ping',
    description:
      'Check that the Voxbot app is installed and running. Returns its version. Read-only and instant — use this first if anything seems wrong.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { title: 'Is Voxbot running?', ...READ_ONLY },
  },
  {
    name: 'voxbot_projects',
    description: 'List every Voxbot film project on this Mac. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { title: 'List projects', ...READ_ONLY },
  },
  {
    name: 'voxbot_status',
    description:
      'Where a Voxbot film project stands (concept, sheets, audio, film, approvals). Read-only. Omit project for the current one.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name. Optional.' },
      },
      additionalProperties: false,
    },
    annotations: { title: 'Project status', ...READ_ONLY },
  },
  {
    name: 'voxbot_sheets',
    description:
      'The character, prop and location sheets of a Voxbot film project, as JSON with image links. Read-only. Omit project for the current one.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name. Optional.' },
      },
      additionalProperties: false,
    },
    annotations: { title: 'Project sheets', ...READ_ONLY },
  },
  {
    name: 'voxbot_organize_folder',
    description:
      "Sort files in a folder into type sub-folders (Images, Videos, Documents, Audio, Archives, Code, Apps, Other). MOVES FILES — confirm with the user first. By default only the folder's own files are touched; set depth to also tidy files inside sub-folders.",
    inputSchema: {
      type: 'object',
      properties: {
        folder: {
          type: 'string',
          description:
            "Folder name like Downloads or Desktop, or a full path starting with /.",
        },
        depth: {
          type: 'string',
          description:
            "How many levels to organize. '1' (default) = this folder's own files only. '2' or '3' = that many levels of sub-folders. 'all' = every level.",
        },
      },
      required: ['folder'],
      additionalProperties: false,
    },
    annotations: { title: 'Organize a folder', destructiveHint: true, openWorldHint: false },
  },
  {
    name: 'voxbot_type',
    description:
      'Type text wherever the cursor currently is. SIDE-EFFECTING — it types into whatever app is focused, so confirm with the user first.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Text to type.' } },
      required: ['text'],
      additionalProperties: false,
    },
    annotations: { title: 'Type at the cursor', destructiveHint: true, openWorldHint: false },
  },
  {
    name: 'voxbot_do',
    description:
      "Send a free-form request to Voxbot's own agent, exactly as if spoken to the app — open and control apps (After Effects, Premiere, Photoshop, Finder…), type, look at the screen, run Voxbot's film factory. POWERFUL AND SIDE-EFFECTING — confirm the exact wording with the user first. Anything that spends credits (films, renders, sheets, audio, music, images) does NOT start from here: Voxbot shows a Yes / Not yet card on the Mac and waits for the person's own click, so tell them to check their Mac. Can run for many minutes.",
    inputSchema: {
      type: 'object',
      properties: {
        request: {
          type: 'string',
          description: 'What you want Voxbot to do, in plain language.',
        },
      },
      required: ['request'],
      additionalProperties: false,
    },
    annotations: { title: 'Ask Voxbot to do something', destructiveHint: true, openWorldHint: true },
  },
];

async function dispatch(name, args) {
  switch (name) {
    case 'voxbot_ping':
      return callVoxbot(['ping'], 30_000);
    case 'voxbot_projects':
      return callVoxbot(['projects'], 30_000);
    case 'voxbot_status':
      return callVoxbot(
        args?.project ? ['status', String(args.project)] : ['status'],
        30_000,
      );
    case 'voxbot_sheets':
      return callVoxbot(
        args?.project ? ['sheets', String(args.project)] : ['sheets'],
        30_000,
      );
    case 'voxbot_type':
      if (!args?.text) return { ok: false, text: 'text is required.' };
      return callVoxbot(['type', String(args.text)], 30_000);
    case 'voxbot_do':
      if (!args?.request) return { ok: false, text: 'request is required.' };
      return callVoxbot(['do', String(args.request)], 960_000);
    case 'voxbot_organize_folder': {
      if (!args?.folder) return { ok: false, text: 'folder is required.' };
      const depth = args.depth ? String(args.depth) : '1';
      if (existsSync(ORGANIZE_SH)) {
        // Call the organizer directly — deterministic, no LLM in the loop.
        return run('/bin/zsh', [ORGANIZE_SH, String(args.folder), depth], 600_000);
      }
      const phrase =
        depth === '1'
          ? `organize my ${args.folder}`
          : `organize my ${args.folder} including sub-folders ${depth} levels deep`;
      return callVoxbot(['do', phrase], 600_000);
    }
    default:
      return { ok: false, text: `Unknown tool: ${name}` };
  }
}

// ── JSON-RPC over stdio ────────────────────────────────────────────────
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) =>
  send({ jsonrpc: '2.0', id, error: { code, message } });

const rl = readline.createInterface({ input: process.stdin });

rl.on('line', async (line) => {
  const raw = line.trim();
  if (!raw) return;
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  const { id, method, params } = msg;
  // Notifications carry no id and expect no response.
  if (id === undefined || id === null) return;

  try {
    switch (method) {
      case 'initialize':
        return reply(id, {
          protocolVersion: params?.protocolVersion || '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'voxbot', version: VERSION },
          instructions:
            "Voxbot is the person's voice assistant on this Mac. Use voxbot_do for anything — apps, typing, the screen, films. Check voxbot_ping first if unsure it's running. Anything that costs credits waits for the person's own Yes on their Mac.",
        });
      case 'ping':
        return reply(id, {});
      case 'tools/list':
        return reply(id, { tools: TOOLS });
      case 'tools/call': {
        const res = await dispatch(params?.name, params?.arguments || {});
        return reply(id, {
          content: [{ type: 'text', text: res.text }],
          isError: !res.ok,
        });
      }
      case 'resources/list':
        return reply(id, { resources: [] });
      case 'prompts/list':
        return reply(id, { prompts: [] });
      default:
        return fail(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return fail(id, -32603, String(e?.message || e));
  }
});
