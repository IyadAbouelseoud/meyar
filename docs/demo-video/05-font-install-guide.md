# Font install guide · so Effect Craft (and Film Craft, Photo Craft) see Meyar's fonts

Four families, all free under the SIL Open Font License. About 10 minutes on Windows. **Never install or use Reem Kufi.**

| Family | Used for in the video | Download page |
|---|---|---|
| Alexandria | Scene titles, wordmark moment, motto | https://fonts.google.com/specimen/Alexandria |
| IBM Plex Sans Arabic | Every label and callout | https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic |
| Readex Pro | Phone chapter callouts (patient voice) | https://fonts.google.com/specimen/Readex+Pro |
| IBM Plex Mono | Gene names, alleles, VCF lines, kit IDs | https://fonts.google.com/specimen/IBM+Plex+Mono |

The repo's `design/fonts/` only has `.woff2` web files. Desktop apps need `.ttf`, so download from Google Fonts. Don't convert the woff2s: they're subset to Arabic or Latin only.

## Steps (Windows)

1. **Close Effect Craft, Film Craft and Photo Craft.** Most apps only read the font list at launch.
2. For each of the four pages above: click **Get font**, then **Download all**. You get one `.zip` per family.
3. Unzip each one into a folder, e.g. `D:\meyar project folder\fonts\`.
4. **Alexandria and Readex Pro are variable fonts.** Their zip has a variable `.ttf` at the top and a `static` folder. Install **both** the variable file and everything in `static\`. Effect Craft lists variable fonts, but the static files are the safe choice for exact weights (Alexandria ExtraBold = 800, Readex Pro Medium = 500).
5. IBM Plex Sans Arabic and IBM Plex Mono come as static `.ttf` files only. Install all of them.
6. Select all the `.ttf` files for one family, **right-click → Show more options → Install for all users**. Use "for all users", not the plain "Install". Plain Install puts fonts in your user profile only (`%LOCALAPPDATA%\Microsoft\Windows\Fonts`), and some apps, especially ones launched by another process like the MCP bridge, only read `C:\Windows\Fonts`. It will ask for admin permission. Say yes.
7. If Windows says a font is already installed, choose **Replace**.
8. Reopen Effect Craft.

## Check it worked

**In Effect Craft:** make a text layer, open the font list, and type "Plex", "Readex" and "Alexandria". All three should appear, plus IBM Plex Mono.

**Or tell me "fonts installed"** and I'll check from here. I'll ask Effect Craft to rescan and list them. Before you installed anything, it returned zero families for all four.

**Then run the Arabic smoke test** (master plan section 12.0, 15 min):
1. New 1920 × 1080 comp.
2. Text layer: «مِعيار — الجرعة الصحيحة من أول مرة» in **Alexandria ExtraBold**.
3. Text layer: «فحصنا ٣٢ من ٣٥ موضعاً» in **IBM Plex Sans Arabic SemiBold**.
4. Separate text layer: `*1/*2x2` in **IBM Plex Mono Medium**.
5. Render one frame and check:
   - letters are joined (not isolated forms like ف ح ص)
   - words run right to left
   - the kasra under مِ sits under the letter, not floating
   - the digits are Arabic-Indic (٣٢)
   - `*1/*2x2` reads left to right, not `2x2*/1*`

If any check fails, don't fight it. Use the fallback in section 12.0: render the labels as transparent PNGs from HTML with Playwright, and only animate them in Effect Craft.

## If a font still doesn't show

- Restart the PC once. Windows sometimes holds the font cache until a reboot.
- Make sure it's under `C:\Windows\Fonts` (open that folder and search "Plex").
- If Effect Craft lists the font but renders boxes or disconnected letters, the font is fine. Effect Craft's Arabic text engine is the problem, so go straight to the PNG fallback.
