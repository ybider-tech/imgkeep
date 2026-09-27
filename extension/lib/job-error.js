// An error with a short code the ask window can explain (see ERRORS in ask.js).
export class JobError extends Error {
  constructor(code, detail = "") {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}
