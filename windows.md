MASTER TASK — FINAL PRODUCTION WINDOWS DISTRIBUTION FOR TBT CAFE POS

I need you to finish the Windows distribution of the EXISTING WORKING TBT Cafe POS.

DEVELOPMENT ENVIRONMENT:
- I develop the project on Fedora Linux.
- I use Windows 10/11 separately for testing the finished distribution.
- Do NOT assume the developer machine is Windows.
- Do NOT introduce Linux-only runtime behavior into the Windows package.

OWNER ENVIRONMENT:
- One cafe owner
- One Windows laptop
- Windows 10 or Windows 11
- Normal Intel/AMD 64-bit laptop (x64)
- Wi-Fi/internet available
- Microsoft Edge is expected to exist, but fallback to default browser is required
- Owner must not need Node.js, npm, Git, VS Code, Python, terminal commands, or developer setup

CURRENT SITUATION:
The bundled Node runtime problem has already been identified and corrected.
The bundled Windows Node executable now runs correctly.

NEW CURRENT PROBLEM:
The launcher starts, but the local website is NOT opening/rendering correctly at localhost.
It appears that the browser may receive/download an HTML file or otherwise fail to display the production frontend normally.

OBJECTIVE:
Produce a genuinely usable production Windows package:

DOUBLE-CLICK ONE FILE
    ↓
local frontend server starts
    ↓
local print agent starts
    ↓
health checks pass
    ↓
browser opens the REAL localhost URL
    ↓
TBT Cafe POS renders normally
    ↓
POS communicates with existing Cloudflare backend
    ↓
printing continues through existing local print agent

OWNER SHOULD ONLY NEED:
1. Extract ZIP
2. Double-click Start-POS.bat
3. Use the POS

==================================================
ABSOLUTE SAFETY RULE
==================================================

The existing POS application is a WORKING PROTOTYPE.

DO NOT modify application/business logic.

DO NOT modify anything outside the Windows distribution/package area unless absolutely unavoidable.

DO NOT change:
- frontend/src
- billing logic
- orders logic
- products logic
- authentication
- Cloudflare backend
- database logic
- receipt logic
- ESC/POS generation
- QR processing
- Android/Capacitor code
- existing business behavior

The objective is PACKAGING, LOCAL SERVING, WINDOWS STARTUP, and DISTRIBUTION.

Before touching anything:
1. inspect the current repository
2. inspect the existing windows-distribution
3. inspect package.json files
4. inspect frontend/dist
5. inspect launcher.js
6. inspect web-server.js
7. inspect Start-POS.bat
8. inspect bundled node.exe
9. inspect usb-print-agent

Do not guess.

==================================================
PART 1 — DIAGNOSE CURRENT LOCALHOST FAILURE
==================================================

FIRST diagnose the current issue.

Do NOT immediately rewrite the launcher.

Determine exactly why opening localhost is failing.

Inspect:

    windows-distribution/
        launcher.js
        web-server.js
        Start-POS.bat
        frontend/dist/

Specifically verify:

1. Is frontend/dist/index.html present?
2. Are frontend/dist/assets/* files present?
3. Does index.html reference assets using correct paths?
4. Does index.html use absolute `/assets/...` paths?
5. Does Vite's generated `base` configuration match serving the app from:
       http://127.0.0.1:8080/
6. Does web-server.js return:
       Content-Type: text/html
   for index.html?
7. Does web-server.js return:
       Content-Type: text/css
   for CSS?
8. Does web-server.js return:
       application/javascript
   or appropriate JS MIME type?
9. Does it correctly serve images and other static assets?
10. Does SPA fallback return index.html only for application routes?
11. Does a request to `/assets/...` accidentally return index.html?
12. Is index.html being downloaded because of:
       Content-Disposition
       incorrect MIME type
       incorrect HTTP headers
       malformed response
13. Is the browser being launched before server readiness?
14. Is the browser being launched with the wrong URL?
15. Is the launcher opening a local FILE instead of HTTP?
16. Is there any path encoding problem?
17. Is there any issue caused by spaces in the folder path?
18. Is web-server.js using __dirname correctly?
19. Is frontend/dist being found correctly after moving the package?
20. Does the server actually return HTTP 200 for `/`?

TEST THE CURRENT LOCAL SERVER DIRECTLY.

After starting only the packaged web server where possible, verify:

    http://127.0.0.1:8080/
    http://localhost:8080/

Both should return the actual application HTML.

Verify response headers.

Expected behavior:

    HTTP 200
    Content-Type: text/html

NOT:

    application/octet-stream
    text/plain
    download
    file attachment

==================================================
PART 2 — BUILD A PRODUCTION-GRADE STATIC SERVER
==================================================

The final package must serve:

    frontend/dist/

using a reliable lightweight local HTTP server.

Use Node's built-in HTTP/filesystem functionality if possible.
Do NOT add a large framework unnecessarily.

Requirements:

- bind ONLY to 127.0.0.1
- port 8080
- serve index.html correctly
- serve JS/CSS/images/fonts correctly
- correct MIME types
- support React SPA routing
- prevent path traversal
- handle Windows paths correctly
- support spaces in package directory
- support package being moved anywhere
- never depend on my Fedora absolute paths
- never depend on current working directory

CRITICAL:
Requests such as:

    /
    /login
    /billing
    /orders

should return the React index.html.

Requests such as:

    /assets/index-ABC.js
    /assets/index-XYZ.css
    /icons/pizza.png

must return the ACTUAL files and correct MIME types.

Do not return index.html for static asset requests.

==================================================
PART 3 — FRONTEND PRODUCTION BUILD
==================================================

Use the existing frontend production build.

Do NOT use Vite development server for the owner's package.

The owner package must use:

    frontend/dist/

Do not modify React source merely to make packaging easier.

If a Vite base-path issue exists, FIRST determine whether it can be solved in the Windows packaging layer.

Only modify source configuration if absolutely unavoidable, and if so:
- make the smallest possible change
- explain exactly why
- do not change application logic
- do not alter Android behavior

==================================================
PART 4 — BROWSER LAUNCH MUST BE RELIABLE
==================================================

Do NOT rely only on a fragile shell command.

The launcher must:

1. Start web-server.js.
2. Start usb-print-agent/server.js.
3. Poll:
       http://127.0.0.1:8080/
   until HTTP 200.
4. Poll:
       http://127.0.0.1:28080/health
   until HTTP 200.
5. Only after BOTH are healthy, open the browser.
6. Open:
       http://127.0.0.1:8080/
7. Do not open a local file.
8. Do not open index.html directly.
9. Do not open an incorrect port.
10. Open only ONE browser window.

Preferred browser launch order:

1. Microsoft Edge
2. Default Windows browser fallback

Use Windows-safe process launching.

If Edge is available, detect/use its installed executable safely.

Otherwise launch the HTTP URL through the Windows default browser.

Do not assume the current working directory.

==================================================
PART 5 — LAUNCHER RELIABILITY
==================================================

The package must contain:

    Start-POS.bat

This is the ONLY file the owner should double-click.

It must:

- resolve its own folder
- never depend on where the folder was extracted
- never depend on my Fedora path
- launch bundled Windows Node
- start web server
- start print agent
- wait for health
- open browser
- handle failures gracefully
- show understandable errors
- shut down child processes when launcher exits
- avoid duplicate instances
- work with spaces in folder names
- work from Desktop
- work from Documents
- work from another drive
- work from USB drive

Do NOT use:
- npm
- npx
- PowerShell as a required manual step
- Git Bash
- WSL
- Bash syntax
- Linux commands

==================================================
PART 6 — BUNDLED NODE
==================================================

Use the already verified OFFICIAL Windows x64 Node executable.

Do not use:
- Linux Node
- renamed binaries
- custom generated binaries
- unofficial binaries

Final runtime:

    runtime\
        node.exe

Verify:

    runtime\node.exe --version

The owner must not install Node.js.

The owner must not install npm.

The owner must not run npm install.

==================================================
PART 7 — PRINT AGENT
==================================================

Keep the current printer architecture.

The production package must run:

    usb-print-agent/server.js

using the bundled Windows Node executable.

Keep:

    127.0.0.1:28080

Do not expose it to LAN.

Do NOT use virtual printer mode.

Do NOT change ESC/POS payload generation.

Do NOT change QR generation.

Do NOT change receipt formatting.

Do not change Android printer behavior.

The existing package should contain the runtime dependencies needed by the print agent so npm is not required on the owner's PC.

==================================================
PART 8 — CLOUD API
==================================================

The current desktop POS intentionally uses the deployed Cloudflare API.

Keep that behavior.

Do NOT create a local backend.

Do NOT rewrite the data architecture.

The owner has Wi-Fi.

The final runtime should be:

    local frontend
        ↓
    existing Cloudflare API

and:

    local frontend
        ↓
    127.0.0.1:28080
        ↓
    print agent
        ↓
    Windows printer

==================================================
PART 9 — WINDOWS 10 / WINDOWS 11
==================================================

Target:

- Windows 10 x64
- Windows 11 x64

Use only Windows-compatible paths and process behavior.

Do not assume:
- PowerShell
- Git
- WSL
- Cygwin

Do not add unnecessary system dependencies.

Do not require administrator privileges unless the existing Windows printer setup genuinely needs them.

==================================================
PART 10 — SECURITY / DEFENDER
==================================================

Do not disable:
- Windows Defender
- SmartScreen
- antivirus
- firewall

Do not add exclusions.

Do not obfuscate files.

Do not use suspicious download sources.

Use official Node runtime.

If unsigned files may produce SmartScreen warnings, report that honestly.

==================================================
PART 11 — OWNER PACKAGE
==================================================

Create a clean final distribution directory:

    windows-release/

Example structure:

    windows-release/
    ├── Start-POS.bat
    ├── launcher.js
    ├── web-server.js
    ├── runtime/
    │   └── node.exe
    ├── frontend/
    │   └── dist/
    └── usb-print-agent/
        ├── server.js
        ├── package.json
        ├── package-lock.json
        └── node_modules/

Do not include:
- source code
- frontend/src
- frontend/node_modules
- Android source
- backend/deployment source
- Git data
- development-only tooling
- unnecessary files

Do not delete anything from the real repository.

==================================================
PART 12 — CONFIGURATION
==================================================

Do not force the owner to edit JavaScript.

If printer configuration is required, provide a simple configuration file inside the distribution or an existing supported environment/config mechanism.

The owner should not need to edit code.

Do NOT invent printer names.

Use the existing printer configuration behavior.

==================================================
PART 13 — LOGGING
==================================================

The launcher should produce useful diagnostics.

Use a writable application log location if required.

At minimum capture:

- launcher start
- web server start
- print agent start
- health check failures
- browser launch
- child process exit
- fatal startup errors

Do not expose secrets.

Do not put user data unnecessarily into logs.

==================================================
PART 14 — STARTUP UI / ERROR HANDLING
==================================================

The owner is not technical.

Do NOT show meaningless stack traces as the primary error.

Startup should look approximately like:

    TBT Cafe POS
    Starting...

    Web Server       OK
    Print Service    OK
    Browser          Opening...

Then Edge opens automatically.

If something fails:

    TBT Cafe POS could not start.

    Web Server       OK
    Print Service    FAILED

    Please restart TBT Cafe POS.

And log technical details separately.

==================================================
PART 15 — TESTS YOU MUST PERFORM
==================================================

Because development happens on Fedora and the final application runs on Windows:

DO NOT claim Windows execution is verified unless it was actually executed on Windows.

On Fedora, perform all static/package/build validation possible.

Then create a Windows-testable package.

On Windows, test:

TEST 1:
Double-click Start-POS.bat.

Expected:
Edge opens automatically.

TEST 2:
Open:
http://127.0.0.1:8080/

Expected:
POS renders normally.

TEST 3:
Open:
http://localhost:8080/

Expected:
POS renders normally.

TEST 4:
Check:
http://127.0.0.1:28080/health

Expected:
HTTP 200.

TEST 5:
Login.

TEST 6:
Products load.

TEST 7:
Create an order.

TEST 8:
Print receipt.

TEST 9:
Restart.

TEST 10:
Move the entire folder to another location and run again.

TEST 11:
Run from a path containing spaces.

Example:

    C:\Users\Owner\Desktop\TBT Cafe POS\

TEST 12:
Verify Windows 10.

TEST 13:
Verify Windows 11.

TEST 14:
Confirm no global Node/npm is installed.

TEST 15:
Confirm no npm install is required.

TEST 16:
Confirm no developer commands are required.

==================================================
PART 16 — BROWSER CONTENT VALIDATION
==================================================

This is CRITICAL because the current bug is that localhost is not displaying the website correctly.

Explicitly validate:

    GET /
    GET /index.html
    GET /assets/<real-js-file>
    GET /assets/<real-css-file>

For each:
- HTTP status
- Content-Type
- correct file contents
- no forced download
- no attachment headers

Verify browser console does not show:

- MIME type errors
- module loading errors
- 404 asset errors
- CORS errors caused by local serving
- incorrect base URL errors

Do NOT fix these by adding unsafe browser flags.

==================================================
PART 17 — PRODUCTION BUILD REPRODUCIBILITY
==================================================

Create a repeatable Windows packaging process that can be run from Fedora.

It should:

1. build frontend
2. validate dist
3. copy production runtime files
4. copy official Windows Node runtime
5. copy printer agent runtime dependencies
6. validate launcher
7. validate required files
8. produce final ZIP

Do not make the owner run the packaging process.

The developer runs it; the owner only receives the finished ZIP.

==================================================
PART 18 — ZIP
==================================================

At the end create:

    TBT-Cafe-POS-Windows-x64.zip

The ZIP must contain ONLY the final owner package.

The ZIP must be extractable as-is.

After extraction:

    Double-click Start-POS.bat

must be the only required action.

==================================================
PART 19 — DO NOT MAKE UNNECESSARY CHANGES
==================================================

Before implementation, report:

1. Root cause of the current localhost/browser problem.
2. Exact files to be changed.
3. Exact files that will remain untouched.
4. Why each changed file is necessary.
5. Final package architecture.

Then implement ONLY the necessary Windows distribution changes.

DO NOT rewrite the POS.

==================================================
PART 20 — FINAL VERIFICATION
==================================================

Before saying complete:

Verify:

- bundled node.exe starts
- frontend/dist exists
- web server starts
- web server returns HTML correctly
- CSS/JS assets return correct MIME types
- SPA routes work
- print agent starts
- 28080 health works
- launcher waits for readiness
- browser opens HTTP URL
- no file download occurs when opening localhost
- no global Node/npm dependency
- package can be moved
- package uses only relative paths
- no Linux paths
- no Bash commands
- no changes outside Windows distribution

If Windows cannot be physically tested in the current environment, explicitly say:

    "Windows execution not physically verified in this environment."

Do not claim otherwise.

==================================================
FINAL RESPONSE FORMAT
==================================================

Return:

A. ROOT CAUSE OF CURRENT LOCALHOST ISSUE

B. EXACT FILES CHANGED

C. EXACT FILES OUTSIDE WINDOWS DISTRIBUTION CONFIRMED UNCHANGED

D. FINAL WINDOWS PACKAGE TREE

E. BUNDLED NODE VERSION / ARCHITECTURE

F. EXACT STARTUP FLOW

G. LOCAL WEB SERVER DETAILS

H. PRINT AGENT DETAILS

I. BROWSER LAUNCH DETAILS

J. WINDOWS 10 STATUS

K. WINDOWS 11 STATUS

L. TESTS ACTUALLY PERFORMED

M. TESTS STILL REQUIRING REAL WINDOWS

N. FINAL ZIP PATH

O. EXACT OWNER INSTRUCTIONS

OWNER INSTRUCTIONS MUST BE NO MORE THAN:

1. Download ZIP
2. Extract ZIP
3. Double-click Start-POS.bat

CRITICAL FINAL RULE:

Do not touch the working POS logic.
Do not "improve" unrelated code.
Do not redesign the architecture.
Fix the Windows distribution only.