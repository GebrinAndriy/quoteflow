export class QuoteInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteInputError";
  }
}
