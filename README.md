# Voxbot for Claude Desktop

[![MCPB](https://img.shields.io/badge/Claude%20Desktop-extension-blue)](https://zxrstudios.com/voxbot)

Voxbot is a movie-making machine controlled by voice: the filmmaking app and voice assistant in your Mac's menu bar, behind ZXR Studios. This extension lets Claude hand Voxbot a job: drive your apps (After Effects, Premiere, Photoshop and the rest), type at the cursor, tidy a folder, or check how one of your Voxbot film projects stands.

## Requirements

- macOS 13 or later.
- Voxbot installed and running, from <https://zxrstudios.com/voxbot>.
- Node 18 or later (Claude Desktop supplies its own).

## Setup

1. Install Voxbot and grant it the permissions it asks for on first launch (Microphone, Accessibility, Input Monitoring).
2. In Voxbot's menu choose **Connect to Claude…** → **Add to Claude Desktop**, or open `Voxbot.mcpb` with Claude Desktop, and click **Install**.
3. In a Claude Desktop chat, ask: *"Is Voxbot running?"* — the `voxbot_ping` tool answers.

## Usage

- *"Ask Voxbot to open After Effects and put my name on this comp."* → `voxbot_do`
- *"Type 'I'll be there at eight' where my cursor is."* → `voxbot_type`
- *"Tidy my Downloads folder."* → `voxbot_organize_folder`
- *"Where does my Coaster project stand?"* → `voxbot_status`, `voxbot_projects`, `voxbot_sheets`

Anything that costs credits — films, renders, character sheets, audio, music, images — never starts from Claude. Voxbot shows a **Yes / Not yet** card on your Mac and waits for your own click.

## Tools

| Tool | What it does | Annotations |
|---|---|---|
| `voxbot_ping` | Checks Voxbot is running | read-only |
| `voxbot_projects` | Lists your Voxbot film projects | read-only |
| `voxbot_status` | Where a project stands | read-only |
| `voxbot_sheets` | A project's character, prop and location sheets | read-only |
| `voxbot_organize_folder` | Moves a folder's files into type sub-folders | destructive (moves files) |
| `voxbot_type` | Types text at the cursor | destructive (writes into the focused app) |
| `voxbot_do` | Asks Voxbot to do something on your Mac, in plain language | destructive, open-world |

## Privacy Policy

This extension runs entirely on your Mac. It contains no network code of its own: it launches the `voxbot` command-line tool that ships inside the Voxbot app and relays Claude's request to it.

- **Data collection.** The extension collects nothing and stores nothing. Each request is passed to the local Voxbot app and the app's reply is returned to Claude.
- **What Voxbot does with a request.** Voxbot may send the text of a request to the AI services it uses to understand and carry it out, under your Voxbot licence. Voxbot's own handling of data is described in the ZXR Studios privacy policy at <https://zxrstudios.com/privacy>.
- **Third-party sharing.** The extension shares nothing with third parties. It has no analytics, no telemetry, no crash reporting.
- **Retention.** The extension keeps no logs and no history. Voxbot keeps a local activity log on your Mac that you can clear from the app.
- **Contact.** privacy@zxrstudios.com — or <https://zxrstudios.com/privacy>.

## License

MIT — see LICENSE. The connector is open source; the Voxbot app itself is a separate, proprietary product.

## Support

<https://zxrstudios.com/voxbot>
