import { describe, expect, it } from "vitest";
import {
  isPlausibleName,
  isPlausibleEmail,
  isPlausibleSubject,
  isPlausibleMessage,
  containsProfanity,
  isKeyboardSmash,
} from "../contact-validation";

describe("contact-validation.ts", () => {
  describe("isPlausibleName", () => {
    it("should allow valid human names in various languages", () => {
      expect(isPlausibleName("Dimas Saputra")).toBe(true);
      expect(isPlausibleName("John Doe")).toBe(true);
      expect(isPlausibleName("Jean-Luc Picard")).toBe(true);
      expect(isPlausibleName("O'Connor")).toBe(true);
      expect(isPlausibleName("田中 太郎")).toBe(true);
      expect(isPlausibleName("김철수")).toBe(true);
      expect(isPlausibleName("Иван Иванов")).toBe(true);
    });

    it("should reject names containing code symbols or semicolons like keyboard smash in user screenshot", () => {
      expect(isPlausibleName("alsdjadl;fajdofiasdfiaudfo")).toBe(false);
      expect(isPlausibleName("isfuhfiwuehfiahfiasfhaiudfadfhadf")).toBe(false);
      expect(isPlausibleName("Lkadf")).toBe(false);
      expect(isPlausibleName("Asdf")).toBe(false);
      expect(isPlausibleName("john;doe")).toBe(false);
      expect(isPlausibleName("<script>alert(1)</script>")).toBe(false);
      expect(isPlausibleName("user@domain")).toBe(false);
      expect(isPlausibleName("name#1")).toBe(false);
    });

    it("should reject profanity in names across languages", () => {
      expect(isPlausibleName("Anjing Babi")).toBe(false);
      expect(isPlausibleName("Baka Baka")).toBe(false);
      expect(isPlausibleName("Fuck User")).toBe(false);
    });

    it("should allow Kasih as a valid name, but reject terima kasih and kasihan", () => {
      expect(isPlausibleName("Kasih")).toBe(true);
      expect(isPlausibleName("Kasih Anjani")).toBe(true);
      expect(isPlausibleName("terima kasih")).toBe(false);
      expect(isPlausibleName("kasihan")).toBe(false);
      expect(isPlausibleName("kasian")).toBe(false);
    });

    it("should reject repeated words, >4 words, numbers, and sentence phrases in names", () => {
      expect(isPlausibleName("nana nana nana nana nana nana nana dimas sadim disam masid")).toBe(false);
      expect(isPlausibleName("kasihanilah aku")).toBe(false);
      expect(isPlausibleName("udah ah")).toBe(false);
      expect(isPlausibleName("percaya ajalu")).toBe(false);
      expect(isPlausibleName("kurang paham")).toBe(false);
      expect(isPlausibleName("maksudnya kekmana")).toBe(false);
      expect(isPlausibleName("tanam madu lauk mana")).toBe(false);
      expect(isPlausibleName("valid sih ya")).toBe(false);
      expect(isPlausibleName("dimas deh")).toBe(false);
      expect(isPlausibleName("dimas lagi makan nasi")).toBe(false);
      expect(isPlausibleName("john likes eating apples")).toBe(false);
      expect(isPlausibleName("John John")).toBe(false);
      expect(isPlausibleName("One Two Three Four Five")).toBe(false);
      expect(isPlausibleName("Dimas123")).toBe(false);
    });

    it("should reject names that are too short or too long", () => {
      expect(isPlausibleName("A")).toBe(false);
      expect(isPlausibleName("a".repeat(51))).toBe(false);
    });
  });

  describe("containsProfanity", () => {
    it("should detect profanity in 10 languages", () => {
      expect(containsProfanity("this is shit")).toBe(true);
      expect(containsProfanity("dasar anjing kau")).toBe(true);
      expect(containsProfanity("kuso baka")).toBe(true);
      expect(containsProfanity("c'est merde")).toBe(true);
      expect(containsProfanity("que mierda")).toBe(true);
      expect(containsProfanity("scheisse")).toBe(true);
    });

    it("should return false for clean sentences", () => {
      expect(containsProfanity("Hello, I would like to hire you for a project.")).toBe(false);
      expect(containsProfanity("Halo, saya ingin mendiskusikan penawaran kerjanya.")).toBe(false);
    });
  });

  describe("isKeyboardSmash", () => {
    it("should detect common keyboard smash patterns", () => {
      expect(isKeyboardSmash("qwertyuiop")).toBe(true);
      expect(isKeyboardSmash("asdfghjkl")).toBe(true);
      expect(isKeyboardSmash("zxcvbnm")).toBe(true);
      expect(isKeyboardSmash("aaaaaaa")).toBe(true);
    });
  });

  describe("isPlausibleSubject", () => {
    it("should validate subject lines", () => {
      expect(isPlausibleSubject("Project Inquiry")).toBe(true);
      expect(isPlausibleSubject("fuck subject")).toBe(false);
      expect(isPlausibleSubject("asdfghjklqwerty")).toBe(false);
    });
  });

  describe("isPlausibleEmail", () => {
    it("should validate emails correctly", () => {
      expect(isPlausibleEmail("dimas@example.com")).toBe(true);
      expect(isPlausibleEmail("test.user+tag@domain.co.id")).toBe(true);
      expect(isPlausibleEmail("invalid-email")).toBe(false);
      expect(isPlausibleEmail("fuck@example.com")).toBe(false);
    });

    it("should reject disposable email domains and keyboard smash local parts", () => {
      expect(isPlausibleEmail("user@mailinator.com")).toBe(false);
      expect(isPlausibleEmail("test@tempmail.com")).toBe(false);
      expect(isPlausibleEmail("asdfghjkl@gmail.com")).toBe(false);
    });
  });

  describe("isPlausibleMessage", () => {
    it("should validate messages correctly", () => {
      expect(isPlausibleMessage("Hello Dimas, I loved your portfolio and would like to connect.")).toBe(true);
      expect(isPlausibleMessage("Too short")).toBe(false);
      expect(isPlausibleMessage("This message contains anjing and babi")).toBe(false);
    });
  });
});
