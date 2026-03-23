Feature: View current world
  Scenario: Visitor opens the homepage
    Given an active turn
    When the visitor views the current world
    Then the current board, lore, prompt feed, and countdown data are available
