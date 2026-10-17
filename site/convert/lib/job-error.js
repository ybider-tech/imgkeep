// An error with a short code the ask window can explain (see ERRORS in ask.js).
// detail is shown under the message: plain text, or "@messageKey" with subs for a translated message.
export class JobError extends Error {
  constructor(code, detail = "", subs = undefined) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.subs = subs;
  }
}
