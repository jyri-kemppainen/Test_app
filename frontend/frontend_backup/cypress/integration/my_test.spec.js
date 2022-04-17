describe('Places app E2E test', function() {
    it('front page can be opened', function() {   
      let url = Cypress.env('URL')
      cy.visit(url)
      cy.contains('Places App')
      cy.contains('Login')
      cy.contains("Radu's favorite beach")
    })
})