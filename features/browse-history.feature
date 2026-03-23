Feature: Browse history
  Scenario: Visitor inspects prior canon
    Given a resolved turn
    When the system executes the resolved turn
    And the visitor browses history
    Then the visitor can inspect previous turns
