## 1) Initial prompt executed in chat gpt with model GPT 5 Thinking
> *"Take on the role of an experienced software engineer I have to create a webpage that offer to the user the functionality of stopwatch and countdown following those acceptance criterias"*

### Technical Criteria
- Separate code into `index.html` and `script.js`
- Use Vanilla JS
- Implement console logs
- Catch all possible exceptions
- Use **Tailwind CSS**
- Responsive website
- Apply best practices for readability

### Functional Criteria
- Mode selection: **stopwatch** or **countdown**
- Current mode visible
- Time format: `MM:SS` or `HH:MM:SS`
- **Start**, **Pause**, **Reset** buttons
- Stopwatch counts up from `0`
- Countdown allows time entry (`hh:mm:ss`, `mm:ss`, `ss`)
- Countdown runs to `0` and stops automatically
- Visual and/or sound alert at finish
- Usable on desktop & mobile, live UI updates
- Handle invalid inputs gracefully

### General
- Include an **example image** as reference
- **Adapt design** to BusUp’s site: https://www.busup.com/en-us/busup
- Ask for extra info before building


---

## 2) With the initial prompt the model request clarifying the next questions
**Branding & UI**
- Style guide (logo, hex colors, fonts)? Light and/or dark theme?
- Button shapes and hover/active states—mirror busup.com?
- Include BusUp logo, minimal header & footer, or ultra-lean UI?

**Language & Copy**
- Default language + ability to switch?
- Preference for validation message style?

**Features & Behavior**
- Time formats supported (`HH:MM:SS` and/or `MM:SS`)?
- Countdown input style: single field parsing or H/M/S fields?
- Alert at zero: visual, sound, or both? Any external assets allowed?
- Auto-stop cap or run indefinitely?
- Pause/Resume button style—single toggle or separate buttons?
- Extras: laps, shortcuts, remember last countdown in LocalStorage?

**Tech & Delivery**
- Tailwind via CDN or precompiled?
- Browser/ES constraints?
- Console logging style—structured with levels?
- Deployment path specifics?
- Accessibility targets?

**Content**
- Whether to include the provided example image in an info modal?

---

## My answers was the following:
- **Style**: Align to busup.com; support **light & dark** modes.
- **Buttons**: Mirror busup.com styles.
- **Layout**: Include BusUp **logo**, minimal **header** and **footer**.
- **Language**: Default **English** with language switch.
- **Validation UI**: No preference.
- **Formats**: Support **HH:MM:SS** and **MM:SS**.
- **Countdown Input**: **Single field** parser.
- **Alert**: **Color flash + beep**, no external assets.
- **Safety Cap**: **Auto-stop** (at 99:59:59).
- **Controls**: **Separate** Start/Pause buttons.
- **Persistence**: Remember last countdown in **LocalStorage**.
- **Tailwind**: via **CDN**.
- **Console Logs**: **Structured** with levels.
- **Other constraints**: None specified.
- **Example image**: **No** modal/image needed.

---

## 3)From the first delivery I only request a few corrections
- Header and footer should use the **same green** as the rest of the page.
- Use the **official logo**: `https://www.busup.com/hubfs/BUS%20-%202023/busup-logo.svg`
- In **dark mode**, timer numbers were not visible.

With this I received a good final MVP
---

