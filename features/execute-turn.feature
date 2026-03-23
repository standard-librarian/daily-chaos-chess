Feature: Execute turn
  Scenario: Resolved turn is executed into canon
    Given a resolved turn
    When the system executes the resolved turn
    Then a new world snapshot and lore entry are published
