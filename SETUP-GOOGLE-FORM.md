# Wiring the contact form to Google Workspace

Your form on `contact.html` keeps its own styling. Google runs
the backend. Nothing is embedded, no iframe, no Google branding
on your page.

Responses land in a Google Sheet in your Workspace Drive, and
you get an email per enquiry.

**Time: about 10 minutes.**

---

## 1. Create the Sheet

Google Drive > New > Google Sheet. Name it something like
`PatchMortem — website enquiries`.

Keep it in a **Shared Drive**, not your personal My Drive, so it
survives if the creating account is ever suspended.

## 2. Open Apps Script

In the Sheet: **Extensions > Apps Script**.

Delete the placeholder `myFunction()` block.

## 3. Paste the script

Open `assets/apps-script-endpoint.gs` from this folder. Copy the
whole file, paste it into the editor.

Set the notification address near the top:

    var NOTIFY_TO = "hello@zurlux.com";

Save (Ctrl/Cmd+S).

## 4. Deploy as a Web App

**Deploy > New deployment**

- Click the gear next to "Select type", choose **Web app**
- Description: `PatchMortem contact form`
- **Execute as: Me**
- **Who has access: Anyone**

Click **Deploy**. Authorise when prompted — you will see an
"unverified app" warning because it is your own script. Click
**Advanced > Go to (project name)** and allow.

> "Anyone" means anyone can POST to the URL. It does not expose
> the Sheet. The script only appends rows.

Copy the **Web app URL**. It looks like:

    https://script.google.com/macros/s/AKfycb.../exec

## 5. Verify the deployment

Paste that URL into a browser. You should see:

    {"ok":true,"service":"patchmortem-contact","ts":"..."}

If you see an error page, the deployment access setting is wrong.
Go back to step 4.

## 6. Point the site at it

Open `assets/pm-config.js`, set:

    formEndpoint: "https://script.google.com/macros/s/AKfycb.../exec",

That is the only change. Every page picks it up.

## 7. Test

Open `contact.html`, submit a real enquiry. Within a few seconds:

- a new row appears in the Sheet
- an email arrives at `NOTIFY_TO`
- the page shows "Thank you — we will be in touch..."

---

## Redeploying after edits

Apps Script does **not** update the live URL when you save.
After changing the script:

**Deploy > Manage deployments > (pencil icon) > Version: New
version > Deploy**

The URL stays the same. Forgetting this step is the single most
common reason "my change did nothing".

---

## Why text/plain

`pm-config.js` sends the request with
`Content-Type: text/plain` when the endpoint is on
`script.google.com`.

Apps Script cannot respond to a CORS preflight `OPTIONS`
request. Sending `application/json` triggers one, and the
submission fails in the browser with a CORS error. `text/plain`
keeps it a "simple request" so no preflight is issued. The body
is still JSON and the script parses it.

This is detected automatically. Do not change it.

---

## Spam

A honeypot field (`#f-website`) is now on the form. It is
positioned off-screen, `aria-hidden`, and `tabindex="-1"` — real
users and screen readers never reach it. Bots fill every field
they find. The script silently accepts and discards any
submission where it is non-empty.

That handles crude bots. If you start getting targeted spam, add
Cloudflare Turnstile or reCAPTCHA v3 and verify the token inside
`doPost` before `appendRow_`.

---

## If you would rather use an actual Google Form

You can, but you lose the styling. Two ways:

**Embed the iframe** — fastest, worst looking. Google's fonts and
chrome inside your teal page, plus a "created inside Zurlux
Technologies" footer.

**POST to the Form's `formResponse` endpoint** — keeps your
styling, but you must extract each field's `entry.XXXXXXX` ID
from the form's HTML, they break silently if the form is edited,
and you cannot read the response to confirm success.

The Apps Script route above avoids both problems, which is why
it is the one wired up.

---

## Data residency

Worth knowing before a CISO asks. Your security page states that
all customer data stays in AWS ap-south-1 with no cross-border
replication. Enquiry data submitted through this form is stored
in Google Workspace, not in ap-south-1.

That distinction is defensible — a sales enquiry is not customer
telemetry — but have the answer ready rather than discovering
the question. If you are on Workspace Business Plus or
Enterprise, check whether **Data Regions** is available on your
tier and set it to India.

If you would rather keep everything in your own infrastructure,
replace `formEndpoint` with an endpoint on
`api.patchmortem.com`. The payload format is unchanged and
`pm-config.js` needs no edit beyond the URL.
