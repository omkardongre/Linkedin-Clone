import { environment } from "src/environments/environment.prod";

describe("AuthModule", () => {
  describe("Register Functionality", () => {
    beforeEach(() => {
      cy.visit("/signup");
    });
    it("should show validation error for short first name", () => {
      cy.get("ion-input[label='First Name']").type("A");
      cy.get("body").click(0, 0);
      cy.contains(
        "First Name is required and should be at least 2 characters long",
      ).should("be.visible");
    });

    it("should show validation error for short last name", () => {
      cy.get("ion-input[label='Last Name']").type("B");
      cy.get("body").click(0, 0);
      cy.contains(
        "Last Name is required and should be at least 2 characters long",
      ).should("be.visible");
    });

    it("should show validation error for invalid email", () => {
      cy.get("ion-input[label='Email or phone number']").type("invalidemail");
      cy.get("body").click(0, 0);
      cy.contains("Please enter a valid email").should("be.visible");
    });

    it("should show validation error for short password", () => {
      cy.get("ion-input[label='Password (6+ characters)']").type("12345");
      cy.get("body").click(0, 0);
      cy.contains("Password must be at least 6 characters long").should(
        "be.visible",
      );
    });

    it("should register a new user", () => {
      cy.fixture("user").then((user) => {
        const { firstName, lastName, email, password } = user;
        cy.register(firstName, lastName, email, password);
        cy.url().should("include", "/home");
      });
    });

    it("should handle registration error", () => {
      cy.fixture("user").then((user) => {
        const { firstName, lastName, email, password } = user;
        cy.register(firstName, lastName, email, password);
        cy.url().should("include", "/signup");
      });
    });

    it("should navigate to sign in page", () => {
      cy.get("a[href='login']").click();
      cy.url().should("include", "/login");
    });
  });

  describe("Login Functionality", () => {
    beforeEach(() => {
      cy.visit("/login");
    });

    it("should redirect to auth page if not signed in", () => {
      cy.visit("/");
      cy.url().should("include", "/login");
    });

    it("should toggle to sign up form", () => {
      cy.visit("/login");
      cy.get('a[href="signup"]').click();
      cy.url().should("include", "/signup");
    });

    it("should have disabled SignIn button by default", () => {
      cy.visit("/login");
      cy.get("ion-button.signin-btn").should("have.attr", "disabled");
    });

    it("should show validation error for invalid email", () => {
      cy.get("ion-input[label='Email or phone']").type("invalidemail");
      cy.get("ion-input[label='Password']").type("password123");
      cy.get("ion-text[color='danger']").should(
        "contain",
        "Enter a valid email",
      );
    });

    it("should show validation error for short password", () => {
      cy.get("ion-input[label='Password']").type("short");
      cy.get("ion-input[label='Email or phone']").type("valid@email.com");
      cy.get("ion-text[color='danger']").should(
        "contain",
        "Password must be at least 6 characters",
      );
    });

    it("should login a user", () => {
      cy.fixture("user").then((user) => {
        const { email, password } = user;
        cy.login(email, password);
        cy.url().should("include", "/home");
      });
    });

    it("should logout a user", () => {
      cy.fixture("user").then((user) => {
        const { email, password } = user;
        cy.login(email, password);
        cy.url().should("include", "/home");
        cy.logout();
        cy.url().should("include", "/login");
      });
    });
  });
});
