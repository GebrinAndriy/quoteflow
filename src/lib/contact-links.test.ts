import { describe, expect, it } from "vitest";
import { addressLines, mapsHref, phoneHref } from "./contact-links";

describe("contact links", () => {
  it("dials the number without spaces or brackets", () => {
    expect(phoneHref("+353 (85) 492-7104")).toBe("tel:+353854927104");
  });

  it("splits the stored address into its lines", () => {
    expect(addressLines("42 Grafton Street\nDublin 2\nD02 R590")).toEqual(["42 Grafton Street", "Dublin 2", "D02 R590"]);
  });

  it("searches the whole address on the map as one line", () => {
    expect(mapsHref("42 Grafton Street\nDublin 2")).toBe(
      "https://www.google.com/maps/search/?api=1&query=42%20Grafton%20Street%2C%20Dublin%202",
    );
  });
});
