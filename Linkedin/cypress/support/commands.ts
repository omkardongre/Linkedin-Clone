/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... });
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
export { };
declare global {
  namespace Cypress {
    interface Chainable {
      register(
        firstName: string,
        lastName: string,
        email: string,
        password: string,
      ): Chainable<void>;
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

function register(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
) {
  cy.visit("/signup");
  cy.get("ion-input[label='First Name']").type(firstName);
  cy.get("ion-input[label='Last Name']").type(lastName);
  cy.get("ion-input[label='Email or phone number']").type(email);
  cy.get("ion-input[label='Password (6+ characters)']").type(password);
  cy.get("ion-button.agree-join-btn").click();
}

function login(email: string, password: string) {
  cy.visit("/login");
  cy.get("ion-input[label='Email or phone']").type(email);
  cy.get("ion-input[label='Password']").type(password);
  cy.get("ion-button.signin-btn").click();
}

function logout() {
  cy.get("div#present-popover").click();
  cy.get("ion-item#sign-out").click();
}

Cypress.Commands.add("register", register);
Cypress.Commands.add("login", login);
Cypress.Commands.add("logout", logout);
